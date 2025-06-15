# WebSeal 多阶段构建 Dockerfile

# 第一阶段：构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# 复制前端依赖文件
COPY client/package*.json ./
RUN npm ci --only=production

# 复制前端源码并构建
COPY client/ ./
RUN npm run build

# 第二阶段：构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# 安装系统依赖（用于构建 native 模块）
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# 复制后端依赖文件
COPY server/package*.json ./
RUN npm ci --only=production

# 第三阶段：生产环境
FROM node:18-alpine

# 安装 Chromium 和其他运行时依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# 设置 Puppeteer 使用系统安装的 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 创建应用目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webseal -u 1001

# 复制后端应用
COPY --from=backend-builder --chown=webseal:nodejs /app/server ./server
COPY --chown=webseal:nodejs server/src ./server/src

# 复制前端构建产物
COPY --from=frontend-builder --chown=webseal:nodejs /app/client/dist ./server/public

# 创建必要的目录
RUN mkdir -p /app/server/uploads /app/server/data && \
    chown -R webseal:nodejs /app/server/uploads /app/server/data

# 切换到非 root 用户
USER webseal

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "server/src/index.js"]
