const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class ScreenshotService {
    constructor() {
        this.browser = null;
        this.uploadsDir = path.join(__dirname, '../uploads');
        
        // 确保上传目录存在
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async initBrowser() {
        if (!this.browser) {
            console.log('正在启动浏览器...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            });
            console.log('浏览器启动成功');
        }
        return this.browser;
    }

    async captureScreenshot(url, options = {}) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            // 设置视窗大小
            await page.setViewport({
                width: options.width || 1920,
                height: options.height || 1080,
                deviceScaleFactor: options.deviceScaleFactor || 1
            });

            // 设置用户代理
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            console.log(`正在访问网页: ${url}`);
            
            // 访问网页
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: options.timeout || 30000
            });

            // 等待页面完全加载
            await page.waitForTimeout(options.delay || 2000);

            // 滚动到页面底部以确保所有内容加载
            if (options.fullPage !== false) {
                await page.evaluate(() => {
                    return new Promise((resolve) => {
                        let totalHeight = 0;
                        const distance = 100;
                        const timer = setInterval(() => {
                            const scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;

                            if (totalHeight >= scrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 100);
                    });
                });

                // 滚动回顶部
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.waitForTimeout(1000);
            }

            // 生成文件名
            const filename = `screenshot-${uuidv4()}.png`;
            const filepath = path.join(this.uploadsDir, filename);

            // 截图
            console.log(`正在生成截图: ${filename}`);
            await page.screenshot({
                path: filepath,
                fullPage: options.fullPage !== false,
                type: 'png',
                quality: options.quality || 90
            });

            console.log(`截图完成: ${filepath}`);
            return filepath;

        } catch (error) {
            console.error('截图过程中发生错误:', error);
            throw new Error(`截图失败: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async getPageInfo(url) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const info = await page.evaluate(() => {
                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };
            });

            return info;

        } catch (error) {
            console.error('获取页面信息失败:', error);
            throw new Error(`获取页面信息失败: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('浏览器已关闭');
        }
    }
}

// 创建单例实例
const screenshotService = new ScreenshotService();

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到 SIGTERM 信号，正在关闭浏览器...');
    await screenshotService.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('收到 SIGINT 信号，正在关闭浏览器...');
    await screenshotService.close();
    process.exit(0);
});

module.exports = screenshotService;
