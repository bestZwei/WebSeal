const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class WatermarkService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads');
    }

    /**
     * 将文本转换为二进制字符串
     */
    textToBinary(text) {
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }

    /**
     * 将二进制字符串转换为文本
     */
    binaryToText(binary) {
        const chars = [];
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                if (charCode === 0) break; // 遇到结束符
                chars.push(String.fromCharCode(charCode));
            }
        }
        return chars.join('');
    }

    /**
     * 使用LSB算法在图片中嵌入水印
     */
    async addWatermark(imagePath, watermarkText, customText = '') {
        try {
            console.log(`正在添加水印到图片: ${path.basename(imagePath)}`);
            
            // 读取图片
            const image = await Jimp.read(imagePath);
            
            // 构建完整的水印信息
            const fullWatermark = JSON.stringify({
                watermark: watermarkText,
                custom: customText,
                timestamp: new Date().toISOString(),
                signature: 'WEBSEAL_WATERMARK'
            });

            // 将水印文本转换为二进制
            const binaryData = this.textToBinary(fullWatermark + '\0'); // 添加结束符
            
            console.log(`水印信息长度: ${fullWatermark.length} 字符, ${binaryData.length} 位`);
            
            // 检查图片是否足够大来存储水印
            const totalPixels = image.getWidth() * image.getHeight();
            const availableBits = totalPixels * 3; // 每个像素的RGB三个通道
            
            if (binaryData.length > availableBits) {
                throw new Error('图片太小，无法存储指定的水印信息');
            }

            // 嵌入水印
            let dataIndex = 0;
            
            image.scan(0, 0, image.getWidth(), image.getHeight(), function(x, y, idx) {
                if (dataIndex < binaryData.length) {
                    // 处理 R 通道
                    if (dataIndex < binaryData.length) {
                        const pixel = this.bitmap.data[idx];
                        const bit = parseInt(binaryData[dataIndex]);
                        this.bitmap.data[idx] = (pixel & 0xFE) | bit;
                        dataIndex++;
                    }
                    
                    // 处理 G 通道
                    if (dataIndex < binaryData.length) {
                        const pixel = this.bitmap.data[idx + 1];
                        const bit = parseInt(binaryData[dataIndex]);
                        this.bitmap.data[idx + 1] = (pixel & 0xFE) | bit;
                        dataIndex++;
                    }
                    
                    // 处理 B 通道
                    if (dataIndex < binaryData.length) {
                        const pixel = this.bitmap.data[idx + 2];
                        const bit = parseInt(binaryData[dataIndex]);
                        this.bitmap.data[idx + 2] = (pixel & 0xFE) | bit;
                        dataIndex++;
                    }
                }
            });

            // 生成带水印的文件名
            const originalName = path.basename(imagePath, path.extname(imagePath));
            const extension = path.extname(imagePath);
            const watermarkedFilename = `${originalName}-watermarked-${uuidv4()}${extension}`;
            const watermarkedPath = path.join(this.uploadsDir, watermarkedFilename);

            // 保存带水印的图片
            await image.writeAsync(watermarkedPath);
            
            console.log(`水印添加完成: ${watermarkedFilename}`);
            return watermarkedPath;

        } catch (error) {
            console.error('添加水印失败:', error);
            throw new Error(`添加水印失败: ${error.message}`);
        }
    }

    /**
     * 从图片中检测和提取水印
     */
    async detectWatermark(imagePath) {
        try {
            console.log(`正在检测水印: ${path.basename(imagePath)}`);
            
            // 读取图片
            const image = await Jimp.read(imagePath);
            
            // 提取LSB位
            let binaryData = '';
            const maxBits = image.getWidth() * image.getHeight() * 3;
            
            image.scan(0, 0, image.getWidth(), image.getHeight(), function(x, y, idx) {
                if (binaryData.length < maxBits) {
                    // 提取 R 通道的 LSB
                    binaryData += (this.bitmap.data[idx] & 1).toString();
                    
                    // 提取 G 通道的 LSB
                    binaryData += (this.bitmap.data[idx + 1] & 1).toString();
                    
                    // 提取 B 通道的 LSB
                    binaryData += (this.bitmap.data[idx + 2] & 1).toString();
                }
            });

            // 尝试解码水印文本
            let extractedText = '';
            try {
                extractedText = this.binaryToText(binaryData);
            } catch (e) {
                console.log('未找到有效的水印数据');
                return null;
            }

            // 查找水印签名
            const signatureIndex = extractedText.indexOf('WEBSEAL_WATERMARK');
            if (signatureIndex === -1) {
                console.log('未找到 WebSeal 水印签名');
                return null;
            }

            // 提取水印前的JSON数据
            const jsonData = extractedText.substring(0, signatureIndex + 'WEBSEAL_WATERMARK'.length);
            const endIndex = jsonData.lastIndexOf('"}');
            if (endIndex === -1) {
                console.log('水印数据格式无效');
                return null;
            }

            const watermarkJson = jsonData.substring(0, endIndex + 2);
            
            try {
                const watermarkInfo = JSON.parse(watermarkJson);
                
                if (watermarkInfo.signature === 'WEBSEAL_WATERMARK') {
                    console.log('水印检测成功');
                    return {
                        watermarkText: watermarkInfo.watermark,
                        customText: watermarkInfo.custom,
                        timestamp: watermarkInfo.timestamp,
                        confidence: 0.95 // 简单的置信度评分
                    };
                }
            } catch (e) {
                console.log('水印JSON解析失败:', e.message);
            }

            return null;

        } catch (error) {
            console.error('水印检测失败:', error);
            throw new Error(`水印检测失败: ${error.message}`);
        }
    }

    /**
     * 添加可见水印（用于演示）
     */
    async addVisibleWatermark(imagePath, text, options = {}) {
        try {
            const image = await Jimp.read(imagePath);
            
            // 加载字体
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            
            // 计算文本位置
            const textWidth = Jimp.measureText(font, text);
            const textHeight = Jimp.measureTextHeight(font, text);
            
            const x = options.x || (image.getWidth() - textWidth - 20);
            const y = options.y || (image.getHeight() - textHeight - 20);
            
            // 添加半透明背景
            const overlay = new Jimp(textWidth + 20, textHeight + 10, 0x00000080);
            image.composite(overlay, x - 10, y - 5);
            
            // 添加文本
            image.print(font, x, y, text);
            
            // 生成新文件名
            const originalName = path.basename(imagePath, path.extname(imagePath));
            const extension = path.extname(imagePath);
            const visibleWatermarkFilename = `${originalName}-visible-${uuidv4()}${extension}`;
            const visibleWatermarkPath = path.join(this.uploadsDir, visibleWatermarkFilename);
            
            await image.writeAsync(visibleWatermarkPath);
            
            return visibleWatermarkPath;
            
        } catch (error) {
            console.error('添加可见水印失败:', error);
            throw new Error(`添加可见水印失败: ${error.message}`);
        }
    }

    /**
     * 比较两张图片的相似度
     */
    async compareImages(imagePath1, imagePath2) {
        try {
            const image1 = await Jimp.read(imagePath1);
            const image2 = await Jimp.read(imagePath2);
            
            // 调整图片大小以便比较
            const width = Math.min(image1.getWidth(), image2.getWidth());
            const height = Math.min(image1.getHeight(), image2.getHeight());
            
            image1.resize(width, height);
            image2.resize(width, height);
            
            // 计算差异
            const diff = Jimp.diff(image1, image2);
            
            return {
                similarity: 1 - diff.percent,
                difference: diff.percent,
                totalPixels: width * height
            };
            
        } catch (error) {
            console.error('图片比较失败:', error);
            throw new Error(`图片比较失败: ${error.message}`);
        }
    }
}

module.exports = new WatermarkService();
