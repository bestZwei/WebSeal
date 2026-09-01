#!/usr/bin/env node
/**
 * 生成 Ed25519 签名密钥对，用于 WebSeal 水印签名。
 *
 * 用法：node scripts/generate-keys.mjs
 *
 * 输出的两个环境变量请配置到运行环境（.env.local / docker-compose environment /
 * 密钥管理服务），私钥绝不要提交到代码库。
 */
import crypto from 'crypto';
import { createHash } from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
const publicPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

const der = publicKey.export({ format: 'der', type: 'spki' });
const fingerprint = 'sha256:' + createHash('sha256').update(der).digest('base64');

console.log('已生成 Ed25519 密钥对，公钥指纹（可公示用于核对）:');
console.log(`  ${fingerprint}`);
console.log('');
console.log('配置到运行环境:');
console.log('');
console.log('WEBSEAL_PRIVATE_KEY 如下（PKCS8）:');
console.log(privatePem);
console.log('WEBSEAL_PUBLIC_KEY 如下（SPKI）:');
console.log(publicPem);
console.log('提示: 仅配置 WEBSEAL_PRIVATE_KEY 时，公钥会自动从私钥推导，验证与公示同样可用。');
