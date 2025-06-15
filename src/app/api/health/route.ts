import { NextResponse } from 'next/server';
import puppeteer, { type LaunchOptions } from 'puppeteer';

export async function GET() {
  try {
    // 检查Puppeteer是否可用
    let puppeteerStatus = false;
    let puppeteerError = null;
    
    try {
      // 根据平台配置适当的选项
      const isWin = process.platform === 'win32';
      const puppeteerOptions: LaunchOptions = {
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
        ],
      };
      
      // 在非Windows生产环境中使用特定的Chromium路径
      if (!isWin && process.env.NODE_ENV === 'production') {
        puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
      }
      
      // 尝试启动一个轻量级的浏览器实例来测试
      const browser = await puppeteer.launch(puppeteerOptions);
      await browser.close();
      puppeteerStatus = true;
    } catch (error) {
      puppeteerError = (error as Error).message;      // 尝试使用更简单的配置重试
      if (puppeteerError) {
        try {
          const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox']
          });
          await browser.close();
          puppeteerStatus = true;
          puppeteerError = null; // 重置错误信息
        } catch (retryError) {
          puppeteerError = `Initial error: ${puppeteerError}, Retry error: ${(retryError as Error).message}`;
        }
      }
    }

    // 简单的健康检查
    const healthCheck = {
      status: puppeteerStatus ? 'ok' : 'partial',
      timestamp: new Date().toISOString(),
      service: 'WebSeal',
      version: '1.0.0',
      uptime: process.uptime(),
      puppeteer: {
        available: puppeteerStatus,
        error: puppeteerError,
        platform: process.platform
      },
      environment: process.env.NODE_ENV || 'unknown'
    };

    return NextResponse.json(healthCheck, { 
      status: puppeteerStatus ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
