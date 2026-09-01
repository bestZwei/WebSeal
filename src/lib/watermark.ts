import sharp from 'sharp';
import { verifyPayload } from './signature';

export interface WatermarkPayload {
  timestamp: string;
  customText: string;
  url: string;
}

export interface EmbeddedWatermark extends WatermarkPayload {
  signature?: string | null;
}

export interface ExtractedWatermark extends WatermarkPayload {
  version: string;
  /** 水印是否携带签名（v1.0 旧格式或未配置密钥时为 false） */
  signed: boolean;
  /** 签名验证结果：true 通过 / false 被篡改或伪造 / null 无法判定（服务未配置公钥） */
  signatureVerified: boolean | null;
}

/**
 * 构造参与签名的规范 payload。签名与验签双方必须使用完全相同的字节序列，
 * 因此固定字段顺序序列化，禁止直接 JSON.parse 后再 stringify 的松散比较。
 */
export function canonicalPayload(data: WatermarkPayload): Buffer {
  return Buffer.from(
    JSON.stringify({ timestamp: data.timestamp, customText: data.customText, url: data.url }),
    'utf8'
  );
}

/**
 * 使用LSB算法嵌入盲水印到图像中
 * @param imageBuffer 原始图像buffer
 * @param data 要嵌入的水印数据（signature 为 base64 签名，null/undefined 表示未签名模式）
 * @returns 包含水印的图像buffer
 */
export async function addWatermark(imageBuffer: Buffer, data: EmbeddedWatermark): Promise<Buffer> {
  try {
    // 准备水印数据
    const watermarkText = JSON.stringify({
      version: '2.0',
      timestamp: data.timestamp,
      customText: data.customText,
      url: data.url,
      signature: data.signature ?? null
    });

    // 将文本转换为二进制
    const binaryData = textToBinary(watermarkText);
    
    // 添加结束标记
    const binaryWithEnd = binaryData + '1111111111111110'; // 结束标记

    // 使用sharp处理图像
    const { data: pixelData, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    
    // 检查图像是否足够大来存储水印
    const totalPixels = width * height;
    const bitsNeeded = binaryWithEnd.length;
    
    if (bitsNeeded > totalPixels * channels) {
      throw new Error('Image too small to store watermark data');
    }

    // 复制像素数据
    const modifiedPixels = Buffer.from(pixelData);

    // 嵌入水印数据
    for (let i = 0; i < binaryWithEnd.length; i++) {
      const bit = parseInt(binaryWithEnd[i]);
      const pixelIndex = i % (totalPixels * channels);
      
      // 修改最低有效位 (LSB)
      modifiedPixels[pixelIndex] = (modifiedPixels[pixelIndex] & 0xFE) | bit;
    }

    // 将修改后的像素数据转换回PNG
    const watermarkedImage = await sharp(modifiedPixels, {
      raw: {
        width,
        height,
        channels
      }
    })
    .png()
    .toBuffer();

    return watermarkedImage;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

/**
 * 从图像中提取盲水印
 * @param imageBuffer 包含水印的图像buffer
 * @returns 提取的水印数据（含签名验证结果），无有效水印时返回 null
 */
export async function extractWatermark(imageBuffer: Buffer): Promise<ExtractedWatermark | null> {
  try {
    const { data: pixelData, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const totalPixels = width * height;

    // 提取二进制数据
    let binaryData = '';
    const endMarker = '1111111111111110';
    
    for (let i = 0; i < totalPixels * channels; i++) {
      const bit = pixelData[i] & 1; // 获取最低有效位
      binaryData += bit.toString();
      
      // 检查是否到达结束标记
      if (binaryData.length >= endMarker.length) {
        const currentEnd = binaryData.slice(-endMarker.length);
        if (currentEnd === endMarker) {
          // 找到结束标记，移除它
          binaryData = binaryData.slice(0, -endMarker.length);
          break;
        }
      }
      
      // 防止无限循环，设置最大长度（长 URL + 中文自定义文字的 UTF-8 编码可达数万比特）
      if (binaryData.length > 100000) {
        throw new Error('Watermark data too long or corrupted');
      }
    }

    // 将二进制转换为文本
    const watermarkText = binaryToText(binaryData);
    
    try {
      const parsed = JSON.parse(watermarkText) as WatermarkPayload & {
        version?: string;
        signature?: string | null;
      };
      const payload: WatermarkPayload = {
        timestamp: parsed.timestamp,
        customText: parsed.customText,
        url: parsed.url
      };

      // v1.0 旧格式无签名字段；signature 为 null 表示未配置密钥时的未签名模式
      const signed = typeof parsed.signature === 'string' && parsed.signature.length > 0;
      return {
        ...payload,
        version: parsed.version ?? '1.0',
        signed,
        signatureVerified: signed ? verifyPayload(canonicalPayload(payload), parsed.signature!) : null
      };
    } catch (parseError) {
      console.error('Failed to parse watermark data:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error extracting watermark:', error);
    return null;
  }
}

/**
 * 将文本转换为二进制字符串（UTF-8 编码，支持中文等多字节字符）
 */
function textToBinary(text: string): string {
  return Array.from(Buffer.from(text, 'utf8'))
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
}

/**
 * 将二进制字符串转换为文本（UTF-8 解码）
 */
function binaryToText(binary: string): string {
  // 确保二进制字符串长度是8的倍数
  const paddedBinary = binary.padEnd(Math.ceil(binary.length / 8) * 8, '0');

  const bytes: number[] = [];
  for (let i = 0; i < paddedBinary.length; i += 8) {
    const byte = parseInt(paddedBinary.slice(i, i + 8), 2);
    if (byte > 0) { // 忽略填充的空字节
      bytes.push(byte);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

/**
 * 验证图片是否包含有效水印
 */
export async function validateWatermark(imageBuffer: Buffer): Promise<boolean> {
  const watermarkData = await extractWatermark(imageBuffer);
  return watermarkData !== null;
}
