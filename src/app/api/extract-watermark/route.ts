import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { extractWatermark } from '@/lib/watermark';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile || typeof imageFile === 'string') {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // 将文件转换为Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 通过文件内容识别真实格式（上传时的 MIME 类型可被伪造）。
    // LSB 水印存储在像素最低有效位中，JPEG 的有损压缩会破坏水印数据，
    // 因此仅接受 PNG 格式。
    let format: string | undefined;
    try {
      const metadata = await sharp(buffer).metadata();
      format = metadata.format;
    } catch {
      return NextResponse.json(
        { error: '上传的文件不是有效的图片' },
        { status: 400 }
      );
    }

    if (format !== 'png') {
      return NextResponse.json(
        {
          error:
            format === 'jpeg'
              ? '不支持 JPEG/JPG 图片：JPEG 的有损压缩会破坏 LSB 水印数据，请上传原始 PNG 快照'
              : `不支持的图片格式: ${format ?? 'unknown'}，请上传 PNG 格式的快照`,
        },
        { status: 400 }
      );
    }

    // 提取水印
    const watermarkData = await extractWatermark(buffer);

    if (!watermarkData) {
      return NextResponse.json(
        { error: 'No watermark found in the image' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: watermarkData.timestamp,
      customText: watermarkData.customText,
      url: watermarkData.url,
      extractedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Watermark extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract watermark' },
      { status: 500 }
    );
  }
}
