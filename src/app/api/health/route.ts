import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 简单的健康检查
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'WebSeal',
      version: '1.0.0',
      uptime: process.uptime(),
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      },
      { status: 500 }
    );
  }
}
