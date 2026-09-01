// SSRF 防护回归测试：npm test（通过 tsx 运行）
// 重点回归：普通域名不得被 isPrivateHostname 误判（曾导致所有截图被拦截）
import { checkPublicHttpUrl, checkPublicHttpUrlWithDns, isPrivateHostname, isBlockedIp } from '../src/lib/url-guard.ts';

let failed = 0;
function check(name, cond, detail) {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond && detail !== undefined) console.log('  detail:', JSON.stringify(detail));
}

// 普通域名不是私有主机名（回归核心：修复前 example.com 被误判为 true）
check('普通域名不是私有主机名', isPrivateHostname('example.com') === false);
check('普通域名不是私有主机名（带根点）', isPrivateHostname('example.com.') === false);
check('公网 IPv4 字面量不是私有主机名', isPrivateHostname('104.20.23.154') === false);
check('公网 IPv6 字面量不是私有主机名', isPrivateHostname('2606:4700:10::6814:179a') === false);

// 私有/本地字面量必须拦截
check('localhost 拦截', isPrivateHostname('localhost') === true);
check('子域 .local 拦截', isPrivateHostname('foo.local') === true);
check('IPv4 回环拦截', isBlockedIp('127.0.0.1') === true);
check('IPv4 私有段拦截', isBlockedIp('10.1.2.3') === true && isBlockedIp('192.168.1.1') === true && isBlockedIp('172.16.0.1') === true);
check('云元数据地址拦截', isBlockedIp('169.254.169.254') === true);
check('IPv6 回环拦截', isBlockedIp('::1') === true);
check('IPv6 ULA 拦截', isBlockedIp('fd00::1') === true);
check('IPv4 映射 IPv6 拦截', isBlockedIp('::ffff:127.0.0.1') === true);

// URL 级校验
check('https 普通域名放行', checkPublicHttpUrl('https://example.com').ok === true);
check('localhost URL 拦截', checkPublicHttpUrl('http://localhost:3000').ok === false);
check('内网 IP URL 拦截', checkPublicHttpUrl('http://10.0.0.1/x').ok === false);
check('元数据 IP URL 拦截', checkPublicHttpUrl('http://169.254.169.254/latest/meta-data').ok === false);
check('IPv6 回环 URL 拦截', checkPublicHttpUrl('http://[::1]/').ok === false);
check('带凭证 URL 拦截', checkPublicHttpUrl('http://evil@10.0.0.1').ok === false);
check('非 http/https 协议拦截', checkPublicHttpUrl('ftp://example.com').ok === false);
check('非法 URL 拦截', checkPublicHttpUrl('not-a-url').ok === false);

// DNS 级校验（依赖外网 DNS，github runner 环境同样可用）
{
  const r = await checkPublicHttpUrlWithDns('https://example.com');
  check('DNS 校验：公网域名放行', r.ok === true, r);
}

process.exit(failed ? 1 : 0);
