import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import puppeteer, { type LaunchOptions } from 'puppeteer';
import { addWatermark, canonicalPayload } from '@/lib/watermark';
import { signPayload } from '@/lib/signature';
import { TSA_ENABLED, requestTimestamp, type TimestampResult } from '@/lib/tsa';
import { checkPublicHttpUrl, checkPublicHttpUrlWithDns, isPrivateHostname } from '@/lib/url-guard';
import { logger, logSafeHost } from '@/lib/logger';

const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

// 子资源请求允许的无网络协议（data:/blob: 常见于内嵌图片，无 SSRF 风险）
const SAFE_SUBRESOURCE_PROTOCOLS = new Set(['data:', 'blob:', 'about:']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const customText = typeof body?.customText === 'string' ? body.customText.slice(0, 500) : '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // SSRF 防护：同步校验（协议/凭证/主机名字面量）
    const syncCheck = checkPublicHttpUrl(url);
    if (!syncCheck.ok) {
      return NextResponse.json({ error: syncCheck.error }, { status: 400 });
    }

    // SSRF 防护：DNS 解析校验（拦截解析到内网的域名，缓解 DNS rebinding）
    const dnsCheck = await checkPublicHttpUrlWithDns(url);
    if (!dnsCheck.ok) {
      return NextResponse.json({ error: dnsCheck.error }, { status: 400 });
    }

    const isLinuxProd = process.platform !== 'win32' && process.env.NODE_ENV === 'production';

    // 注意：不做任何证书校验豁免——快照内容必须经过完整 TLS 验证
    const puppeteerOptions: LaunchOptions = {
      headless: true,
      ...(isLinuxProd ? { executablePath: CHROMIUM_PATH } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    };

    let browser;
    try {
      browser = await puppeteer.launch(puppeteerOptions);
    } catch (browserError) {
      logger.error('browser_launch_failed', { message: (browserError as Error).message });
      // 重试，使用更简单的配置
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });
      } catch (retryError) {
        throw new Error(`Failed to start browser: ${(retryError as Error).message}`);
      }
    }

    try {
      const page = await browser.newPage();

      // 子资源 SSRF 拦截：阻止页面内的 file:/ftp: 等协议请求，
      // 以及 IP 字面量指向内网的子资源（主文档已做完整 DNS 校验）
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        try {
          const reqUrl = new URL(req.url());
          if (!SAFE_SUBRESOURCE_PROTOCOLS.has(reqUrl.protocol)
            && reqUrl.protocol !== 'http:'
            && reqUrl.protocol !== 'https:') {
            req.abort();
            return;
          }
          if (isPrivateHostname(reqUrl.hostname)) {
            req.abort();
            return;
          }
          req.continue();
        } catch {
          req.abort();
        }
      });

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      // 等待页面稳定，超时则继续截图（不阻断）
      try {
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
      } catch {
        logger.warn('page_ready_state_timeout', { host: logSafeHost(url) });
      }

      // 智能等待：网络空闲（连续 500ms 无网络请求）替代硬编码延时，
      // 动态内容加载完成即继续，静态页面不空等；超时 8s 兜底
      try {
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 });
      } catch {
        logger.warn('network_idle_timeout', { host: logSafeHost(url) });
      }

      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });

      // 关闭浏览器（失败不阻断后续水印处理）
      await browser.close().catch(() => {});

      const timestamp = new Date().toISOString();

      // 对水印内容签名（未配置 WEBSEAL_PRIVATE_KEY 时退化为未签名模式）
      const signature = signPayload(
        canonicalPayload({ timestamp, customText: customText || '', url })
      );

      const watermarkedImage = await addWatermark(Buffer.from(screenshot), {
        timestamp,
        customText: customText || '',
        url,
        signature,
      });

      const base64Image = `data:image/png;base64,${watermarkedImage.toString('base64')}`;
      const imageHash = crypto.createHash('sha256').update(watermarkedImage).digest('hex');

      // 可信时间戳（RFC 3161）：对最终快照 PNG 的哈希背书。
      // 未配置 TSA 时跳过；请求失败默认降级为无时间戳（可配 WEBSEAL_TSA_REQUIRED=true 强制失败）
      let tsa: TimestampResult | null = null;
      if (TSA_ENABLED) {
        try {
          tsa = await requestTimestamp(Buffer.from(imageHash, 'hex'), process.env.WEBSEAL_TSA_URL!.trim());
          logger.info('tsa_timestamp_obtained', { genTime: tsa.genTime.toISOString() });
        } catch (tsaError) {
          logger.warn('tsa_request_failed', { message: (tsaError as Error).message });
          if (process.env.WEBSEAL_TSA_REQUIRED === 'true') {
            return NextResponse.json(
              { error: `可信时间戳服务请求失败: ${(tsaError as Error).message}` },
              { status: 502 }
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        imageUrl: base64Image,
        timestamp,
        originalUrl: url,
        customText: customText || '',
        signed: !!signature,
        imageHash,
        tsa: tsa && {
          token: tsa.token,
          genTime: tsa.genTime.toISOString(),
          hashHex: tsa.hashHex,
          tsaUrl: tsa.tsaUrl,
        },
      });
    } catch (pageError) {
      // 确保浏览器被关闭，避免进程泄漏
      await browser.close().catch(() => {});
      throw pageError;
    }
  } catch (error) {
    logger.error('screenshot_failed', { message: (error as Error)?.message });

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
        details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined,
      },
      { status: 500 }
    );
  }
}
