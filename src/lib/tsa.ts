import crypto from 'crypto';
import { AsnParser, AsnSerializer, OctetString } from '@peculiar/asn1-schema';
import { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { ContentInfo, EncapsulatedContentInfo, SignedData } from '@peculiar/asn1-cms';
import {
  MessageImprint,
  PKIStatus,
  TimeStampReq,
  TimeStampResp,
  TSTInfo,
} from '@peculiar/asn1-tsp';

/**
 * RFC 3161 可信时间戳（TSA）客户端。
 *
 * 流程：对最终快照 PNG 计算 SHA-256 → 向 TSA 提交哈希 → 获得 TSA 签名的时间戳令牌。
 * 令牌证明"该哈希对应的数据在 genTime 时刻已存在"，时间不由本服务说了算。
 *
 * 令牌作为伴随凭证文件（sidecar）随图分发，而非嵌入水印——
 * 嵌入会改变图片字节，导致哈希与令牌不再对应（鸡生蛋问题）。
 *
 * 环境变量：
 *   - WEBSEAL_TSA_URL       TSA 服务地址（RFC 3161，如 https://freetsa.org/tsr）；未配置则功能关闭
 *   - WEBSEAL_TSA_REQUIRED  设为 true 时 TSA 失败会导致截图失败（默认 best-effort 不阻断）
 *
 * 说明：本模块校验令牌的哈希绑定与 nonce 回显；对 TSA 证书链的完整密码学验证
 * 依赖信任锚配置，可通过 openssl ts -verify 离线复核，或作为后续迭代。
 */

export const TSA_ENABLED = !!process.env.WEBSEAL_TSA_URL?.trim();

const SHA256_OID = '2.16.840.1.101.3.4.2.1';
const TST_INFO_OID = '1.2.840.113549.1.9.16.1.4'; // id-smime-ct-TSTInfo

export interface TimestampResult {
  /** base64 编码的 DER TimeStampResp，原样保存即可用 openssl 复核 */
  token: string;
  genTime: Date;
  /** 被背书的 SHA-256（hex），与 messageImprint 一致 */
  hashHex: string;
  /** 随机数回显校验，防重放（hex） */
  nonce: string;
  tsaUrl: string;
}

export interface TsaTokenInfo {
  genTime: Date;
  /** 令牌声明的被背书哈希（hex） */
  hashHex: string;
  nonce?: string;
  serialNumber?: string;
  policy?: string;
}

/** 生成 8 字节随机 nonce（schema 中 nonce 用 ArrayBuffer 转换器） */
function newNonce(): ArrayBuffer {
  const nonce = new Uint8Array(8);
  crypto.getRandomValues(nonce);
  return nonce.buffer;
}

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

/** 构造 RFC 3161 TimeStampReq（DER） */
export function buildTimestampRequest(hashBuffer: Buffer, nonce: ArrayBuffer): Buffer {
  const req = new TimeStampReq({
    version: 1,
    messageImprint: new MessageImprint({
      hashAlgorithm: new AlgorithmIdentifier({ algorithm: SHA256_OID }),
      hashedMessage: new OctetString(toArrayBuffer(hashBuffer)),
    }),
    nonce,
    certReq: true, // 令牌内包含 TSA 证书，便于后续离线验证
  });
  return Buffer.from(AsnSerializer.serialize(req));
}

/** 解析 TimeStampResp，提取 TSTInfo 关键字段；结构非法时抛错 */
export function parseTimestampResponse(respDer: Buffer): { genTime: Date; hashHex: string; nonce?: string; serialNumber?: string; policy?: string } {
  const resp = AsnParser.parse(respDer, TimeStampResp);

  const status = resp.status?.status;
  if (status !== PKIStatus.granted && status !== PKIStatus.grantedWithMods) {
    throw new Error(`TSA rejected the request (status: ${status})`);
  }

  const token: ContentInfo | undefined = resp.timeStampToken;
  if (!token) throw new Error('TSA response contains no timestamp token');

  // CMS 结构：ContentInfo.content [0] -> SignedData -> encapContentInfo -> eContent -> TSTInfo
  const contentDer = token.content as ArrayBuffer | undefined;
  if (!contentDer || contentDer.byteLength === 0) {
    throw new Error('Timestamp token has no content');
  }
  const signedData = AsnParser.parse(Buffer.from(contentDer), SignedData);
  const eci: EncapsulatedContentInfo = signedData.encapContentInfo;
  if (eci.eContentType !== TST_INFO_OID) {
    throw new Error(`Unexpected encapsulated content type: ${eci.eContentType}`);
  }
  // TSTInfo 封装在 OCTET STRING 中（EncapsulatedContent 的 single 分支）
  const single = eci.eContent?.single;
  if (!single) throw new Error('Timestamp token has no encapsulated content');

  const tst = AsnParser.parse(Buffer.from(single.buffer), TSTInfo);

  const hashHex = Buffer.from(tst.messageImprint.hashedMessage.buffer).toString('hex');

  return {
    genTime: tst.genTime,
    hashHex,
    nonce: tst.nonce ? Buffer.from(tst.nonce as ArrayBuffer).toString('hex') : undefined,
    serialNumber: tst.serialNumber ? Buffer.from(tst.serialNumber as ArrayBuffer).toString('hex') : undefined,
    policy: tst.policy,
  };
}

/**
 * 向 TSA 请求时间戳令牌。
 * @param artifactHash 对被背书产物（最终 PNG）计算的 SHA-256
 * @returns 令牌与元信息；TSA 不可用/拒绝时抛出异常（调用方决定降级还是失败）
 */
export async function requestTimestamp(artifactHash: Buffer, tsaUrl: string, timeoutMs = 12000): Promise<TimestampResult> {
  const nonce = newNonce();
  const reqDer = buildTimestampRequest(artifactHash, nonce);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(tsUrl(tsaUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
        Accept: 'application/timestamp-reply',
      },
      body: new Uint8Array(reqDer),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`TSA returned HTTP ${response.status}`);
  }
  const respDer = Buffer.from(await response.arrayBuffer());

  // 先解析校验状态与回显，再交付令牌
  const info = parseTimestampResponse(respDer);
  const nonceHex = Buffer.from(nonce).toString('hex');
  if (info.hashHex !== artifactHash.toString('hex')) {
    throw new Error('TSA token messageImprint does not match submitted hash');
  }
  if (info.nonce !== nonceHex) {
    throw new Error('TSA token nonce mismatch (possible replay)');
  }

  return {
    token: respDer.toString('base64'),
    genTime: info.genTime,
    hashHex: info.hashHex,
    nonce: nonceHex,
    tsaUrl,
  };
}

/** 令牌内容解析（提取验证用）：返回关键字段，不做信任链验证 */
export function inspectToken(tokenBase64: string): TsaTokenInfo {
  const respDer = Buffer.from(tokenBase64, 'base64');
  const info = parseTimestampResponse(respDer);
  return {
    genTime: info.genTime,
    hashHex: info.hashHex,
    nonce: info.nonce,
    serialNumber: info.serialNumber,
    policy: info.policy,
  };
}

/**
 * 提取侧验证：令牌中的哈希是否与上传图片的实际哈希一致。
 * hashMatch=true 意味着"该图片自 genTime 起未被修改，且时间经 TSA 背书"。
 */
export async function verifyTokenAgainstImage(tokenBase64: string, imageHashHex: string): Promise<{
  hashMatch: boolean;
  genTime?: Date;
  tsaInfo?: TsaTokenInfo;
  error?: string;
}> {
  let info: TsaTokenInfo;
  try {
    info = inspectToken(tokenBase64);
  } catch (error) {
    return { hashMatch: false, error: `令牌解析失败: ${(error as Error).message}` };
  }
  return {
    hashMatch: info.hashHex.toLowerCase() === imageHashHex.toLowerCase(),
    genTime: info.genTime,
    tsaInfo: info,
  };
}

function tsUrl(url: string): string {
  // 允许用户只填服务根地址的粗略容错
  return url.startsWith('http') ? url : `https://${url}`;
}
