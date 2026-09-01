import crypto from 'crypto';

/**
 * Ed25519 水印签名模块。
 *
 * 密钥仅从环境变量读取（私钥绝不写入代码库或随代码分发）：
 *   - WEBSEAL_PRIVATE_KEY  PKCS8 PEM，用于签发；未配置时水印以未签名模式嵌入
 *   - WEBSEAL_PUBLIC_KEY   SPKI PEM，用于验证；未配置时回退为从私钥推导
 *
 * 生成密钥对：node scripts/generate-keys.mjs
 *
 * 签名的作用：
 *   - 不可伪造：没有私钥无法制造能通过验证的"WebSeal 签发"水印
 *   - 防篡改：时间戳/文字/URL 任一字节被改动，验签即失败
 *   注意：签名不证明时间的真实性（那需要可信时间戳 TSA），仅证明签发来源与内容完整性。
 */

interface KeyCache {
  privateKey?: crypto.KeyObject;
  publicKey?: crypto.KeyObject;
  fingerprint?: string;
}

let cachedKeys: KeyCache | null = null;

function loadKeys(): KeyCache {
  if (cachedKeys) return cachedKeys;

  const privatePem = process.env.WEBSEAL_PRIVATE_KEY?.trim();
  const publicPem = process.env.WEBSEAL_PUBLIC_KEY?.trim();

  let privateKey: crypto.KeyObject | undefined;
  try {
    privateKey = privatePem ? crypto.createPrivateKey(privatePem) : undefined;
  } catch (error) {
    console.error('Invalid WEBSEAL_PRIVATE_KEY, signing disabled:', (error as Error).message);
  }

  let publicKey: crypto.KeyObject | undefined;
  try {
    publicKey = publicPem
      ? crypto.createPublicKey(publicPem)
      : privateKey
        ? crypto.createPublicKey(privateKey) // 从私钥推导对应公钥
        : undefined;
  } catch (error) {
    console.error('Invalid WEBSEAL_PUBLIC_KEY, verification disabled:', (error as Error).message);
  }

  let fingerprint: string | undefined;
  if (publicKey) {
    const der = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    fingerprint = 'sha256:' + crypto.createHash('sha256').update(der).digest('base64');
  }

  cachedKeys = { privateKey, publicKey, fingerprint };
  return cachedKeys;
}

export interface SigningStatus {
  algorithm: 'Ed25519';
  signingEnabled: boolean;
  verificationEnabled: boolean;
  fingerprint?: string;
  publicKeyPem?: string;
}

/** 当前密钥配置状态（用于健康检查/公钥公示接口） */
export function getSigningStatus(): SigningStatus {
  const { publicKey, fingerprint } = loadKeys();
  return {
    algorithm: 'Ed25519',
    signingEnabled: !!loadKeys().privateKey,
    verificationEnabled: !!publicKey,
    fingerprint,
    publicKeyPem: publicKey?.export({ format: 'pem', type: 'spki' }).toString(),
  };
}

/** 对水印 payload 签名，返回 base64 签名；未配置私钥时返回 null（水印退化为未签名模式） */
export function signPayload(payload: Buffer): string | null {
  const { privateKey } = loadKeys();
  if (!privateKey) return null;
  return crypto.sign(null, payload, privateKey).toString('base64');
}

/** 验证水印 payload 签名；未配置公钥时返回 null（无法判定） */
export function verifyPayload(payload: Buffer, signatureBase64: string): boolean | null {
  const { publicKey } = loadKeys();
  if (!publicKey) return null;
  try {
    return crypto.verify(null, payload, publicKey, Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false; // 签名格式非法
  }
}
