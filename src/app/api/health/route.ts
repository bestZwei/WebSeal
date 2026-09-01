import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    // 轻量健康检查：仅验证 Chromium 可执行文件存在且可执行。
    // 不再真实启动浏览器——健康检查可能被监控/容器编排频繁调用，
    // 每次启动完整 Chrome 实例的开销不可接受。
    let chromiumOk = false;
    let chromiumPath: string | null = null;
    let chromiumError: string | null = null;

    try {
      chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      fs.accessSync(chromiumPath, fs.constants.X_OK);
      chromiumOk = true;
    } catch (error) {
      chromiumError = `Chromium not found or not executable at "${chromiumPath ?? 'unknown'}": ${(error as Error).message}`;
    }

    const healthCheck = {
      status: chromiumOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'WebSeal',
      version: '1.0.0',
      uptime: process.uptime(),
      chromium: {
        available: chromiumOk,
        path: chromiumPath,
        error: chromiumError,
        platform: process.platform
      },
      environment: process.env.NODE_ENV || 'unknown'
    };

    return NextResponse.json(healthCheck, {
      status: chromiumOk ? 200 : 503
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
