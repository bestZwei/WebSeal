// TSA 模块离线回归测试：npm test 的一部分（通过 tsx 运行）
// 用 @peculiar 库本地构造合法的 TimeStampResp，验证请求编码、响应解析、
// 哈希匹配与篡改检测，不依赖外网 TSA 服务。
import crypto from 'crypto';
import { AsnParser, AsnSerializer, OctetString } from '@peculiar/asn1-schema';
import { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { ContentInfo, DigestAlgorithmIdentifiers, EncapsulatedContent, EncapsulatedContentInfo, SignerInfos, SignedData } from '@peculiar/asn1-cms';
import {
  MessageImprint,
  PKIStatus,
  PKIStatusInfo,
  TimeStampReq,
  TimeStampResp,
  TSTInfo,
} from '@peculiar/asn1-tsp';
import {
  buildTimestampRequest,
  inspectToken,
  verifyTokenAgainstImage,
} from '../src/lib/tsa.ts';

let failed = 0;
function check(name, cond, detail) {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond && detail !== undefined) console.log('  detail:', JSON.stringify(detail));
}

// 构造合成 TSA 响应：TSTInfo -> CMS ContentInfo 包装 -> TimeStampResp
// 注意：schema 中 nonce/serialNumber 均使用 ArrayBuffer 转换器
function buildResp(hash, nonceBytes, genTime) {
  const tst = new TSTInfo({
    version: 1,
    policy: '1.3.6.1.4.1.13762.3',
    messageImprint: new MessageImprint({
      hashAlgorithm: new AlgorithmIdentifier({ algorithm: '2.16.840.1.101.3.4.2.1' }),
      hashedMessage: new OctetString(new Uint8Array(hash)),
    }),
    serialNumber: new Uint8Array([0x07, 0x5b, 0xcd, 0x15]), // 1234567890
    genTime,
    nonce: new Uint8Array(nonceBytes),
  });
  const eci = new EncapsulatedContentInfo({
    eContentType: '1.2.840.113549.1.9.16.1.4',
    eContent: new EncapsulatedContent({ single: new OctetString(AsnSerializer.serialize(tst)) }),
  });
  // CMS 真实层级：ContentInfo.content [0] -> SignedData -> encapContentInfo -> eContent -> TSTInfo
  const signedDataDer = AsnSerializer.serialize(new SignedData({
    version: 1,
    digestAlgorithms: new DigestAlgorithmIdentifiers([]),
    encapContentInfo: eci,
    signerInfos: new SignerInfos([]),
  }));
  return Buffer.from(AsnSerializer.serialize(new TimeStampResp({
    status: new PKIStatusInfo({ status: PKIStatus.granted }),
    timeStampToken: new ContentInfo({
      contentType: '1.2.840.113549.1.7.2',
      content: signedDataDer instanceof ArrayBuffer
        ? signedDataDer
        : signedDataDer.buffer.slice(signedDataDer.byteOffset, signedDataDer.byteOffset + signedDataDer.byteLength),
    }),
  })));
}

const artifactHash = crypto.createHash('sha256').update('fake-png-bytes').digest();
const nonce = crypto.randomBytes(8);
const nonceHex = nonce.toString('hex');
const genTime = new Date('2026-09-01T12:00:00.000Z');

// 1. 请求编码：反序列化后字段正确
{
  const der = buildTimestampRequest(artifactHash, nonce);
  const parsed = AsnParser.parse(der, TimeStampReq);
  check('请求编码：messageImprint 哈希正确',
    Buffer.from(parsed.messageImprint.hashedMessage.buffer).equals(artifactHash));
  check('请求编码：hashAlgorithm 为 SHA-256',
    parsed.messageImprint.hashAlgorithm.algorithm === '2.16.840.1.101.3.4.2.1');
  check('请求编码：nonce 正确',
    parsed.nonce && Buffer.from(parsed.nonce).toString('hex') === nonceHex);
  check('请求编码：certReq 为 true', parsed.certReq === true);
}

// 2. 响应解析与令牌校验
{
  const tokenBase64 = buildResp(artifactHash, nonce, genTime).toString('base64');
  const info = inspectToken(tokenBase64);
  check('响应解析：genTime 正确', info.genTime.getTime() === genTime.getTime(), info);
  check('响应解析：哈希正确', info.hashHex === artifactHash.toString('hex'), info);
  check('响应解析：nonce 回显正确', info.nonce === nonceHex, info);
  check('响应解析：序列号正确', info.serialNumber === '075bcd15', info);

  const verification = await verifyTokenAgainstImage(tokenBase64, artifactHash.toString('hex'));
  check('令牌校验：哈希匹配', verification.hashMatch === true, verification);
  check('令牌校验：返回背书时间', verification.genTime?.getTime() === genTime.getTime());
}

// 3. 篡改检测：令牌与实际图片哈希不匹配
{
  const tokenBase64 = buildResp(artifactHash, nonce, genTime).toString('base64');
  const tamperedHash = crypto.createHash('sha256').update('tampered-image').digest().toString('hex');
  const verification = await verifyTokenAgainstImage(tokenBase64, tamperedHash);
  check('篡改检测：哈希不匹配', verification.hashMatch === false, verification);
}

// 4. 非法令牌
{
  const verification = await verifyTokenAgainstImage(Buffer.from('garbage').toString('base64'), '00');
  check('非法令牌：返回失败而非抛错', verification.hashMatch === false && !!verification.error, verification);
}

process.exit(failed ? 1 : 0);
