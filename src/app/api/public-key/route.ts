import { NextResponse } from 'next/server';
import { getSigningStatus } from '@/lib/signature';

/**
 * 公钥公示接口：返回当前服务的签名公钥与指纹。
 * 验证方可以在此核对自己持有的公钥指纹是否一致，
 * 公钥指纹通常也会公示在其他渠道（如官网页脚）以防本接口被冒充。
 */
export async function GET() {
  const status = getSigningStatus();

  if (!status.verificationEnabled) {
    return NextResponse.json({
      configured: false,
      message: '服务未配置签名密钥（WEBSEAL_PRIVATE_KEY / WEBSEAL_PUBLIC_KEY），生成的水印不带签名',
    });
  }

  return NextResponse.json({
    configured: true,
    algorithm: status.algorithm,
    fingerprint: status.fingerprint,
    publicKeyPem: status.publicKeyPem,
  });
}
