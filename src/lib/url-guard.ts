import net from 'net';
import dns from 'dns/promises';

/**
 * SSRF 防护模块：
 * 1. 同步校验 URL 协议、凭证、主机名（IP 字面量 / localhost）——用于请求拦截器等高频场景；
 * 2. 异步 DNS 解析校验——确保域名解析出的所有 IP 都不是私有/保留地址，
 *    缓解 DNS rebinding 攻击（解析后校验，攻击者无法用公网域名间接指向内网）。
 */

const LOCAL_HOSTNAMES = new Set(['localhost', 'ip6-localhost', 'ip6-loopback']);
const LOCAL_SUFFIXES = ['.localhost', '.local', '.internal'];

/** IPv4 私有/保留地址段（闭区间，含首尾） */
const BLOCKED_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0x00ffffff], // 0.0.0.0/8       本机
  [0x0a000000, 0x0affffff], // 10.0.0.0/8      私有
  [0x64400000, 0x647fffff], // 100.64.0.0/10   CGNAT
  [0x7f000000, 0x7fffffff], // 127.0.0.0/8     回环
  [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16  链路本地（含云元数据）
  [0xac100000, 0xac1fffff], // 172.16.0.0/12   私有
  [0xc0000000, 0xc00000ff], // 192.0.0.0/24    IETF 保留
  [0xc0000200, 0xc00002ff], // 192.0.2.0/24    TEST-NET-1
  [0xc0586300, 0xc05863ff], // 192.88.99.0/24  6to4 中继
  [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16  私有
  [0xc6120000, 0xc613ffff], // 198.18.0.0/15   基准测试
  [0xc6336400, 0xc63364ff], // 198.51.100.0/24 TEST-NET-2
  [0xcb007100, 0xcb0071ff], // 203.0.113.0/24  TEST-NET-3
  [0xe0000000, 0xefffffff], // 224.0.0.0/4     组播
  [0xf0000000, 0xffffffff], // 240.0.0.0/4     保留/广播
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return true; // 解析失败按不安全处理
  return BLOCKED_IPV4_RANGES.some(([start, end]) => value >= start && value <= end);
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // IPv4 映射地址 ::ffff:a.b.c.d（含 NAT64 64:ff9b::/96），提取内嵌 IPv4 再判
  const v4Mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4Mapped) return isBlockedIpv4(v4Mapped[1]);
  if (lower.startsWith('64:ff9b:')) return true; // NAT64，目标仍是 IPv4 内网

  if (lower === '::' || lower === '::1') return true; // 未指定 / 回环
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 ULA
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 链路本地
  if (lower.startsWith('ff')) return true; // ff00::/8 组播
  if (lower.startsWith('2001:db8')) return true; // 文档保留段

  return false;
}

/** 判断 IP 是否为私有/保留地址 */
export function isBlockedIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isBlockedIpv4(ip);
  if (type === 6) return isBlockedIpv6(ip);
  return true; // 无法识别的格式按不安全处理
}

/**
 * 主机名是否指向内网/本地。
 * 仅做字面量判断（IP 字面量、localhost），不做 DNS——适合请求拦截器等高频路径。
 */
export function isPrivateHostname(hostname: string): boolean {
  // WHATWG URL 对 IPv6 主机名返回带方括号的形式；末尾可能带根点（FQDN 表示）
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');

  if (LOCAL_HOSTNAMES.has(h)) return true;
  if (LOCAL_SUFFIXES.some(suffix => h.endsWith(suffix))) return true;

  return isBlockedIp(h);
}

export interface UrlCheckResult {
  ok: boolean;
  error?: string;
}

/** 同步校验：协议、凭证、主机名字面量。返回 { ok, error } */
export function checkPublicHttpUrl(urlStr: string): UrlCheckResult {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http/https protocols are allowed' };
  }

  // 带凭证的 URL 可能被用于绕过主机名检查（http://evil@10.0.0.1）
  if (url.username || url.password) {
    return { ok: false, error: 'URLs with embedded credentials are not allowed' };
  }

  if (isPrivateHostname(url.hostname)) {
    return { ok: false, error: 'Access to private/internal network addresses is not allowed' };
  }

  return { ok: true };
}

/**
 * 完整校验：同步检查 + DNS 解析校验。
 * 校验域名解析出的所有地址均非私有/保留段，缓解 DNS rebinding。
 * 注意：Puppeteer 导航时会自行再次解析 DNS，无法强制复用此处结果；
 * 残余的 rebinding 窗口由子资源请求拦截器（IP 字面量校验）部分缓解。
 */
export async function checkPublicHttpUrlWithDns(urlStr: string): Promise<UrlCheckResult> {
  const base = checkPublicHttpUrl(urlStr);
  if (!base.ok) return base;

  const url = new URL(urlStr);
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) {
    return { ok: true }; // IP 字面量已在同步检查中判定
  }

  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    return { ok: false, error: 'Unable to resolve domain name' };
  }

  if (addresses.length === 0) {
    return { ok: false, error: 'Domain resolved to no addresses' };
  }

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      return { ok: false, error: 'Domain resolves to a private/internal address' };
    }
  }

  return { ok: true };
}
