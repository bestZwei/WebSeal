# ==============================================================================
# WebSeal - 专业的网页存证工具（Next.js 15 + Puppeteer + Sharp）
#
# 多阶段构建：
#   base    : 基础镜像（Node.js Alpine）
#   deps    : 安装生产/构建依赖
#   builder : 安装 Chromium 及字体，执行 next build（standalone 输出）
#   runner  : 仅包含运行所需产物的精简生产镜像
#
# 构建：
#   docker build -t webseal:1.0.0 --build-arg VERSION=1.0.0 .
# 运行：
#   docker run -d --shm-size=256m -p 3000:3000 webseal:1.0.0
#
# 说明：Puppeteer 自带的 Chrome 下载被跳过（PUPPETEER_SKIP_CHROMIUM_DOWNLOAD），
#       运行期统一使用镜像内通过 apk 安装的 /usr/bin/chromium-browser。
# ==============================================================================

# ---------- base：基础镜像 ----------
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine AS base

# ---------- deps：安装依赖 ----------
FROM base AS deps
# libc6-compat：sharp / 部分原生模块在 Alpine 上需要的 glibc 兼容层
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 只复制依赖清单，充分利用 Docker 层缓存（源码变动不会触发重装依赖）
COPY package.json package-lock.json* ./

# 跳过 Puppeteer 自带 Chrome 下载（运行阶段使用系统 Chromium，deps 阶段无需下载）
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm ci

# ---------- builder：构建应用 ----------
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安装 Chrome 依赖（用于 Puppeteer）
# chromium      浏览器本体
# nss/freetype/harfbuzz  渲染与字体依赖
# ttf-freefont  基础字体
# font-noto-emoji  emoji 字体，避免截图出现豆腐块
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# 设置 Puppeteer 环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 构建应用（输出 .next/standalone，见 next.config.ts 的 output: 'standalone'）
RUN npm run build

# ---------- runner：生产镜像 ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户（容器以最小权限运行）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装 Chrome 依赖
# chromium        浏览器本体
# nss/freetype/harfbuzz  渲染与字体依赖
# ca-certificates TLS 校验（存证不做证书豁免，必须完整验证）
# 字体：
#   ttf-freefont    基础拉丁字体
#   font-noto-emoji emoji 字体
#   font-noto-cjk   ★ 中日韩字体，缺失会导致截图中的中文显示为方块（豆腐块）
#   fontconfig      字体配置与缓存工具（fc-cache）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    font-noto-cjk \
    fontconfig

# 预生成字体缓存，避免首次截图时 Chromium 临时构建缓存导致超时
RUN fc-cache -f

# 设置 Puppeteer 环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ---- 镜像元数据（由 CI 通过 --build-arg 注入，本地构建时用默认值） ----
ARG VERSION=0.0.0-dev
ARG BUILD_DATE
ARG VCS_REF
LABEL org.opencontainers.image.title="WebSeal" \
      org.opencontainers.image.description="专业的网页存证工具 - 使用盲水印技术为网页快照添加时间戳和自定义文字水印" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/bestZwei/WebSeal" \
      org.opencontainers.image.url="https://github.com/bestZwei/WebSeal" \
      org.opencontainers.image.vendor="WebSeal Team" \
      org.opencontainers.image.licenses="Anti-Capitalist Software License 1.4"
ENV APP_VERSION=${VERSION}

# 复制构建产物
# standalone 目录包含 server.js 与 node_modules 的最小子集
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用（standalone 入口）
CMD ["node", "server.js"]
