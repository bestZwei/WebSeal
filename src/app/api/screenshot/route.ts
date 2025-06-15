import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { addWatermark } from '@/lib/watermark';

export async function POST(request: NextRequest) {
  try {
    const { url, customText } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // 设置视口大小
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // 导航到目标页面
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 截取整个页面
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
    });

    await browser.close();

    // 生成时间戳
    const timestamp = new Date().toISOString();    // 添加盲水印
    const watermarkedImage = await addWatermark(Buffer.from(screenshot), {
      timestamp,
      customText: customText || '',
      url
    });

    // 转换为base64
    const base64Image = `data:image/png;base64,${watermarkedImage.toString('base64')}`;

    return NextResponse.json({
      success: true,
      imageUrl: base64Image,
      timestamp,
      originalUrl: url,
      customText: customText || '',
    });

  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}
