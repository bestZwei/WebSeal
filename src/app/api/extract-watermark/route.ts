import { NextRequest, NextResponse } from 'next/server';
import { extractWatermark } from '@/lib/watermark';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, JPEG are allowed' },
        { status: 400 }
      );
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
