# WebSeal 部署指南

本文档介绍如何将 WebSeal 部署到自己的服务器。

> ⚠️ **本项目仅支持服务器部署**（Docker 或裸机运行），不支持 Vercel、Netlify 等 Serverless 平台——截图功能依赖 Puppeteer，需要完整的 Chrome/Chromium 浏览器环境。

## 🐳 Docker 部署（推荐）

Docker 镜像已内置 Chromium 及全部字体依赖，开箱即用。

### 使用 docker-compose 一键启动

```bash
docker-compose up -d
```

### 或手动构建和运行

```bash
# 构建镜像
docker build -t webseal:latest .

# 运行容器
docker run -d -p 3000:3000 --name webseal-container webseal:latest

# 查看日志
docker logs -f webseal-container
```

也可以使用 npm 封装的快捷命令：

```bash
npm run docker:build
npm run docker:run
npm run docker:logs
npm run compose:up
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

### docker-compose.yml 说明

```yaml
services:
  webseal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    mem_limit: 1g        # Puppeteer 截图比较吃内存，建议至少 1g
    mem_reservation: 512m
    shm_size: 256m       # Chrome 需要足够的 /dev/shm
```

## 🖥️ 裸机部署

不使用 Docker 时，需要自行安装 Chrome/Chromium。

### 1. 安装 Chromium

```bash
# Debian / Ubuntu
sudo apt-get install -y chromium-browser

# CentOS / RHEL
sudo yum install -y chromium
```

### 2. 构建和启动

```bash
npm ci
npm run build
npm run start
```

> Linux 生产环境下 Puppeteer 默认查找 `/usr/bin/chromium-browser`。如果 Chromium 安装在其它路径，请设置 `PUPPETEER_EXECUTABLE_PATH` 环境变量。

## 🛠️ 环境变量配置

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `development` | 设为 `production` 启用生产模式（影响 Puppeteer 的 Chromium 路径查找） |
| `PORT` | `3000` | 服务监听端口 |
| `HOSTNAME` | `0.0.0.0` | 服务监听地址 |
| `PUPPETEER_EXECUTABLE_PATH` | 自动查找 | Chromium 可执行文件路径 |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `false` | 跳过 Puppeteer 自带 Chrome 下载（使用系统 Chromium 时设为 `true`） |
| `SCREENSHOT_TIMEOUT` | `45000` | 截图超时时间（毫秒） |
| `WEBSEAL_PRIVATE_KEY` | 未配置 | Ed25519 签名私钥（PKCS8 PEM）。不配置时水印以未签名模式嵌入 |
| `WEBSEAL_PUBLIC_KEY` | 自动推导 | Ed25519 验证公钥（SPKI PEM），省略时从私钥推导 |
| `WEBSEAL_TSA_URL` | 未配置 | RFC 3161 可信时间戳服务地址（如 `https://freetsa.org/tsr`），配置后对快照哈希请求权威时间背书 |
| `WEBSEAL_TSA_REQUIRED` | `false` | 设为 `true` 时 TSA 请求失败会导致截图失败；默认 best-effort 降级为无时间戳 |

### 签名密钥配置

水印签名能让验证方确认"快照由本服务签发且未被篡改"，生产环境建议开启：

```bash
# 生成密钥对（输出私钥/公钥 PEM 与公钥指纹）
node scripts/generate-keys.mjs
```

将输出的 `WEBSEAL_PRIVATE_KEY` / `WEBSEAL_PUBLIC_KEY` 配置到运行环境。私钥务必妥善保管（泄露后需轮换密钥），不要提交到代码库。公钥指纹可通过 `GET /api/public-key` 查询，建议同时公示在其它渠道以便核对。

## 🔒 安全配置

WebSeal 的截图接口会向任意 URL 发起浏览器请求，公网部署时务必注意：

1. **不要暴露在公网不设防**：建议加上认证（如反向代理层 Basic Auth）或仅部署在内网/VPN 中使用。
2. **配置反向代理限流**：示例（Nginx）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # 截图接口耗时较长，放宽超时
        proxy_read_timeout 120s;
    }
}
```

3. **内存与并发**：每次截图都会启动一个 Chrome 实例，建议通过容器 `mem_limit` 或系统层面控制并发，避免高并发打爆内存。

## 🚨 故障排除

### Puppeteer 无法启动

```
Failed to launch the browser process
```

- Docker：确认使用的是项目自带 Dockerfile（已内置 chromium 及字体依赖）。
- 裸机：确认已安装 Chromium，路径正确（`/usr/bin/chromium-browser` 或通过 `PUPPETEER_EXECUTABLE_PATH` 指定）。
- Linux 下以 root 运行时需要 `--no-sandbox`（项目已默认带上）。

### 内存不足（OOM）

- 增加 Docker `mem_limit`，或在 docker-compose 中加大 `shm_size`。
- 减少并发截图请求数量。

### 截图超时

- 目标网站响应缓慢时会触发超时，可调整 `SCREENSHOT_TIMEOUT`。
- 通过 `/api/health` 检查浏览器环境是否正常：

```bash
curl http://localhost:3000/api/health
```

### 中文显示为方块

Docker 镜像已内置 `ttf-freefont` 和 `font-noto-emoji`。裸机部署时如截图中文乱码，安装中文字体：

```bash
# Debian / Ubuntu
sudo apt-get install -y fonts-noto-cjk
```

### 调试命令

```bash
# 查看容器日志
docker logs -f webseal-container

# 检查依赖
npm audit
npm outdated

# 清理缓存重新构建
rm -rf .next node_modules
npm ci
npm run build
```

## ☁️ Render 部署（Docker）

Render 是 PaaS 容器平台（非 Serverless），本项目的 Docker 镜像可以在上面运行。注意：**必须使用 Docker 运行时**，不能用 Render 的 Node 原生运行时（其上未预装 Chromium）。

代码已内置 `--disable-dev-shm-usage`（绕过 Render 受限的 `/dev/shm`），Dockerfile 也已在 Alpine 内装好系统 `chromium`，所以现有镜像可直接部署。

### 方式 A：仓库内置 render.yaml（推荐，一键建服务）

已在仓库根目录提供 `render.yaml`，在 Render 控制台操作：

1. **New → Blueprints** → 关联本仓库，Render 会自动读取 `render.yaml` 创建服务。
2. 在控制台补充 `WEBSEAL_PRIVATE_KEY` / `WEBSEAL_PUBLIC_KEY`（用 `node scripts/generate-keys.mjs` 生成）等可选变量。
3. 点击 Deploy，启动后访问 `https://<服务名>.onrender.com`。

### 方式 B：控制台手动创建

1. **New → Web Service** → 关联仓库。
2. **Environment** 选 `Docker`（Render 自动识别根目录 `Dockerfile`）。
3. **Health Check Path** 填 `/api/health`（项目已自带该接口，正常返回 `status: ok`）。
4. **Instance Type 选 `Standard`（≥1GB 内存）**：Chromium 很吃内存，free / starter 的 512MB 容易 OOM 重启。
5. 添加环境变量：`NODE_ENV=production`，以及可选的 `WEBSEAL_PRIVATE_KEY`、`WEBSEAL_PUBLIC_KEY`、`WEBSEAL_TSA_URL`。
6. Render 会自动注入 `PORT`，Dockerfile 中的 `ENV PORT=3000` 仅为默认值，运行时会被覆盖，无需手动改端口。

### 注意事项

- **内存是主要瓶颈**：每次截图都会启动一个 Chrome 实例，Render 上无法像 `docker-compose` 那样用 `mem_limit` / `shm_size` 控制，请选择足够大的实例类型并控制并发。
- **免费实例会冷启休眠**：长时间无请求后首次访问需等 Chrome 冷启动（约 20~40 秒），生产建议用常驻付费实例。
- **SSRF 风险**：截图接口可访问任意 URL，公网部署建议在服务前加 Cloudflare 或鉴权网关。
- **验证**：部署后访问 `/api/health`，确认 `chromium.available: true` 再正式使用。

---

完成部署后，你的 WebSeal 实例就可以提供网页存证服务了！ 🚀
