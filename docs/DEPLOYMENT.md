# WebSeal 部署指南

本文档详细介绍如何部署 WebSeal 到不同的平台。

## 🚀 Vercel 部署（推荐）

Vercel 是最简单的部署方案，特别适合 Next.js 应用。

### 方法一：一键部署

1. 点击下方按钮一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/WebSeal)

2. 登录或注册 Vercel 账户
3. 授权访问 GitHub（如果需要）
4. 项目会自动 Fork 到你的 GitHub 账户
5. Vercel 会自动构建和部署

### 方法二：从 GitHub 导入

1. **准备项目**
   ```bash
   # Fork 项目到你的 GitHub 账户
   # 或者克隆并推送到你的仓库
   git clone https://github.com/your-username/WebSeal.git
   cd WebSeal
   git remote set-url origin https://github.com/your-username/WebSeal.git
   git push -u origin main
   ```

2. **在 Vercel 中导入**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 从 GitHub 选择 WebSeal 项目
   - 保持默认配置，点击 "Deploy"

3. **配置域名**
   - 部署完成后会获得一个 `.vercel.app` 域名
   - 可以在项目设置中添加自定义域名

### Vercel 配置优化

在项目根目录的 `vercel.json` 已经包含了优化配置：

```json
{
  "version": 2,
  "name": "webseal",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/screenshot/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/extract-watermark/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## 🐳 Docker 部署

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 使用官方 Node.js 镜像
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安装 Chrome 依赖（用于 Puppeteer）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 设置 Puppeteer 使用系统 Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装 Chrome 依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 创建 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  webseal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    mem_limit: 1g
    mem_reservation: 512m
```

### 构建和运行

```bash
# 构建镜像
docker build -t webseal .

# 运行容器
docker run -p 3000:3000 webseal

# 或使用 Docker Compose
docker-compose up -d
```

## ☁️ 其他云平台部署

### Railway

1. 连接 GitHub 仓库到 Railway
2. Railway 会自动检测 Next.js 项目
3. 部署会自动开始

### Netlify

1. 在 Netlify 中连接 GitHub 仓库
2. 设置构建命令：`npm run build`
3. 设置发布目录：`.next`
4. 注意：Netlify 不支持 API 路由，需要使用 Netlify Functions

### Heroku

1. 创建 `Procfile`：
   ```
   web: npm start
   ```

2. 添加 Heroku Buildpack：
   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add jontewks/puppeteer
   ```

3. 部署：
   ```bash
   git push heroku main
   ```

## 🛠️ 环境变量配置

### 可选环境变量

```bash
# Node.js 环境
NODE_ENV=production

# 端口配置
PORT=3000

# 自定义域名（用于元数据）
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Puppeteer 配置
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Vercel 环境变量设置

1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加需要的环境变量
4. 重新部署项目

## 🔧 性能优化

### 1. 图像优化

```javascript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
};
```

### 2. Bundle 分析

```bash
# 安装分析工具
npm install --save-dev @next/bundle-analyzer

# 运行分析
ANALYZE=true npm run build
```

### 3. 缓存配置

```javascript
// 在 API 路由中添加缓存头
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

## 🔒 安全配置

### 1. 内容安全策略

```javascript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 2. Rate Limiting

```typescript
// 可以添加速率限制中间件
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 限制每个 IP 10 次请求
});
```

## 📊 监控和日志

### 1. Vercel Analytics

在 Vercel 项目中启用 Analytics 功能。

### 2. 错误监控

```typescript
// 可以集成 Sentry 等错误监控服务
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 3. 日志记录

```typescript
// 添加结构化日志
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'info', message, data, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, timestamp: new Date().toISOString() }));
  },
};
```

## 🚨 故障排除

### 常见部署问题

1. **Puppeteer 无法启动**
   - 确保安装了所需的系统依赖
   - 检查 Chrome/Chromium 是否正确配置

2. **内存不足**
   - 增加容器内存限制
   - 优化 Puppeteer 参数

3. **构建超时**
   - 检查依赖安装是否有问题
   - 增加构建超时时间

4. **API 路由超时**
   - 检查 Vercel 函数超时配置
   - 优化截图逻辑

### 调试命令

```bash
# 本地调试构建
npm run build
npm start

# 检查依赖
npm audit
npm outdated

# 清理缓存
rm -rf .next
rm -rf node_modules
npm install
```

## 📱 移动端优化

### PWA 配置

```json
// public/manifest.json
{
  "name": "WebSeal",
  "short_name": "WebSeal",
  "description": "专业的网页存证工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 📈 SEO 优化

### Meta 标签配置

项目已经包含了完整的 SEO 配置，包括：

- Open Graph 标签
- Twitter Card 标签
- 结构化数据
- 网站地图

### 网站地图生成

```typescript
// 可以添加动态网站地图生成
export default function sitemap() {
  return [
    {
      url: 'https://webseal.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
```

---

完成部署后，你的 WebSeal 应用就可以为用户提供专业的网页存证服务了！ 🚀
