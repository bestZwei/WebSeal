import sharp from 'sharp';

interface WatermarkData {
  timestamp: string;
  customText: string;
  url: string;
}

/**
 * 使用LSB算法嵌入盲水印到图像中
 * @param imageBuffer 原始图像buffer
 * @param data 要嵌入的水印数据
 * @returns 包含水印的图像buffer
 */
export async function addWatermark(imageBuffer: Buffer, data: WatermarkData): Promise<Buffer> {
  try {
    // 准备水印数据
    const watermarkText = JSON.stringify({
      timestamp: data.timestamp,
      customText: data.customText,
      url: data.url,
      version: '1.0'
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
 * @returns 提取的水印数据
 */
export async function extractWatermark(imageBuffer: Buffer): Promise<WatermarkData | null> {
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
      
      // 防止无限循环，设置最大长度
      if (binaryData.length > 10000) {
        throw new Error('Watermark data too long or corrupted');
      }
    }

    // 将二进制转换为文本
    const watermarkText = binaryToText(binaryData);
    
    try {
      const watermarkData = JSON.parse(watermarkText) as WatermarkData & { version: string };
      return {
        timestamp: watermarkData.timestamp,
        customText: watermarkData.customText,
        url: watermarkData.url
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
 * 将文本转换为二进制字符串
 */
function textToBinary(text: string): string {
  return text
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

/**
 * 将二进制字符串转换为文本
 */
function binaryToText(binary: string): string {
  // 确保二进制字符串长度是8的倍数
  const paddedBinary = binary.padEnd(Math.ceil(binary.length / 8) * 8, '0');
  
  let text = '';
  for (let i = 0; i < paddedBinary.length; i += 8) {
    const byte = paddedBinary.slice(i, i + 8);
    const charCode = parseInt(byte, 2);
    if (charCode > 0) { // 忽略空字符
      text += String.fromCharCode(charCode);
    }
  }
  return text;
}

/**
 * 验证图片是否包含有效水印
 */
export async function validateWatermark(imageBuffer: Buffer): Promise<boolean> {
  const watermarkData = await extractWatermark(imageBuffer);
  return watermarkData !== null;
}
