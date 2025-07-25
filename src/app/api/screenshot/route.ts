import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { type LaunchOptions } from 'puppeteer';
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
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }      // 配置Puppeteer启动选项，根据平台调整
    const isWin = process.platform === 'win32';
    const isDev = process.env.NODE_ENV !== 'production';
    
    const puppeteerOptions: LaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list'
      ]
    };
    
    // Windows开发环境特殊配置
    if (isWin && isDev) {
      // Windows开发环境让Puppeteer自动寻找Chrome
      console.log('Running in Windows development mode');
    } else if (!isWin && !isDev) {
      // Linux生产环境配置
      puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
    }
      // 启动浏览器，添加重试逻辑
    let browser;
    console.log('Attempting to launch browser...');
    try {
      browser = await puppeteer.launch(puppeteerOptions);
      console.log('Browser launched successfully');
    } catch (browserError) {
      console.error('Initial browser launch failed:', browserError);
      // 重试，使用更简单的配置
      try {
        console.log('Retrying with simplified configuration...');
        browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage'] 
        });
        console.log('Browser launched successfully on retry');
      } catch (retryError) {
        throw new Error(`Failed to start browser: ${(retryError as Error).message}`);
      }
    }

    const page = await browser.newPage();

    // 设置视口大小
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // 导航到目标页面，添加错误处理
    try {
      // 设置页面超时
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);
      
      console.log(`Navigating to URL: ${url}`);
      
      // 使用更宽松的等待策略
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // 改为更宽松的等待策略
        timeout: 45000, // 增加超时时间
      });
        console.log('Page navigation completed');
      
      // 等待页面稳定，但设置最大等待时间
      try {
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        console.log('Page load state completed');
      } catch (loadStateTimeout) {
        console.log('Page load state timeout, proceeding with screenshot');
      }
      
      // 额外等待确保页面渲染完成
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Ready to take screenshot');
      
      // 截取整个页面
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      
      // 关闭浏览器
      await browser.close();
      
      // 生成时间戳
      const timestamp = new Date().toISOString();
      
      // 添加盲水印
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
    } catch (pageError) {
      // 确保浏览器被关闭
      await browser.close();
      throw pageError;
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to capture screenshot';
    if (error instanceof Error) {
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Unable to resolve domain name';
      } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Connection refused by target server';
      } else if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        errorMessage = 'Connection to server timed out';
      } else if (error.message.includes('TimeoutError')) {
        errorMessage = 'Page load timeout';
      } else if (error.message.includes('Protocol error')) {
        errorMessage = 'Browser protocol error';
      } else if (error.message.includes('Failed to start browser')) {
        errorMessage = 'Failed to initialize browser environment';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      },
      { status: 500 }
    );
  }
}
