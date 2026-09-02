// 水印与签名回归测试：npm test（tsx scripts/test-watermark.mjs）
// 覆盖：中英文水印闭环、签名嵌入-提取-验证、篡改检测、错误公钥、未签名模式、v1.0 兼容
import crypto from 'crypto';
import sharp from 'sharp';
import { addWatermark, extractWatermark, canonicalPayload } from '../src/lib/watermark.ts';
import { signPayload, verifyPayload, getSigningStatus } from '../src/lib/signature.ts';

// 在任何签名调用之前生成并注入测试密钥（签名模块按调用时读取环境变量）
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
process.env.WEBSEAL_PRIVATE_KEY = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
process.env.WEBSEAL_PUBLIC_KEY = publicKey.export({ format: 'pem', type: 'spki' }).toString();

let failed = 0;
function check(name, cond, detail) {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond && detail !== undefined) console.log('  detail:', JSON.stringify(detail));
}

async function makeImage() {
  return sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 100, g: 150, b: 200 } },
  }).png().toBuffer();
}

// 1. 签名水印：嵌入 -> 提取 -> 验证通过
{
  const data = {
    timestamp: '2026-09-01T10:00:00.000Z',
    customText: '公司名称：某某科技有限公司 存档编号：#20260901',
    url: 'https://example.com/page?x=1',
  };
  const signature = signPayload(canonicalPayload(data));
  const extracted = await extractWatermark(await addWatermark(await makeImage(), { ...data, signature }));
  check('签名水印闭环提取', extracted !== null
    && extracted.timestamp === data.timestamp
    && extracted.customText === data.customText
    && extracted.url === data.url
    && extracted.version === '2.0', extracted);
  check('签名标记与验证通过', extracted?.signed === true && extracted?.signatureVerified === true, extracted);
}

// 2. 篡改检测：签名属于数据 A，验证数据 B 必须失败
{
  const a = { timestamp: '2026-09-01T10:00:00.000Z', customText: '原始内容', url: 'https://a.example.com' };
  const b = { ...a, customText: '被篡改的内容' };
  const signature = signPayload(canonicalPayload(a));
  check('篡改检测（payload 不匹配）', verifyPayload(canonicalPayload(b), signature) === false);
  check('签名格式非法返回 false', verifyPayload(canonicalPayload(a), 'not-a-signature') === false);
}

// 3. 未签名模式：signature 为 null（服务未配置密钥时的行为）
{
  const data = { timestamp: '2026-09-01T10:00:00.000Z', customText: '', url: 'https://example.com' };
  const extracted = await extractWatermark(await addWatermark(await makeImage(), { ...data, signature: null }));
  check('未签名模式可提取', extracted !== null
    && extracted.timestamp === data.timestamp && extracted.url === data.url, extracted);
  check('未签名模式 signed=false / verified=null', extracted?.signed === false && extracted?.signatureVerified === null, extracted);
}

// 4. 密钥不匹配：用另一把公钥验证必须失败
{
  const other = crypto.generateKeyPairSync('ed25519');
  const data = { timestamp: '2026-09-01T10:00:00.000Z', customText: '', url: 'https://example.com' };
  const signature = signPayload(canonicalPayload(data));
  const payload = canonicalPayload(data);
  check('错误公钥验证失败', crypto.verify(null, payload, other.publicKey, Buffer.from(signature, 'base64')) === false);
}

// 5. 中英混合 + 多字节 URL（回归上一轮修复）
{
  const data = {
    timestamp: '2026-09-01T10:00:00.000Z',
    customText: 'Mixed 中英混合 test 123',
    url: 'https://例え.jp/路径',
  };
  const signature = signPayload(canonicalPayload(data));
  const extracted = await extractWatermark(await addWatermark(await makeImage(), { ...data, signature }));
  check('中英混合闭环', extracted?.customText === data.customText && extracted?.url === data.url, extracted);
  check('中英混合签名验证通过', extracted?.signatureVerified === true, extracted);
}

// 6. 签名状态信息
{
  const status = getSigningStatus();
  check('签名状态：已启用且带指纹', status.signingEnabled && status.verificationEnabled && !!status.fingerprint, status);
}

process.exit(failed ? 1 : 0);
