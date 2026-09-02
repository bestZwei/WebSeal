# WebSeal 部署指南

本文档介绍如何将 WebSeal 部署到自己的服务器。

> ⚠️ **本项目仅支持服务器部署**（Docker 或裸机运行），不支持 Vercel、Netlify 等 Serverless 平台——截图功能依赖 Puppeteer，需要完整的 Chrome/Chromium 浏览器环境。

## 📦 版本与镜像

项目采用语义化版本（`主版本.次版本.修订号`），每次发版会自动构建并推送 Docker 镜像到 GHCR：

```
ghcr.io/bestzwei/webseal:<版本>
```

| 镜像标签 | 说明 | 适用场景 |
| --- | --- | --- |
| `1.0.0` | 精确版本，永不变化 | **生产推荐**，可复现、可回滚 |
| `1.0` | 小版本线，跟随该系列的修订号更新 | 只想接收补丁更新 |
| `latest` | 最新正式版 | 尝鲜 / 个人使用 |

查看全部可用版本：[GHCR Packages](https://github.com/bestZwei/WebSeal/pkgs/container/webseal) 或 Releases 页面。

### 发版流程（维护者）

```bash
# 1. 更新 package.json 版本并生成 commit + 标签（patch / minor / major 三选一）
npm run release:patch

# 2. 推送提交与标签
npm run release:push
```

推送 `v*.*.*` 标签后，`.github/workflows/release.yml` 会自动：

1. 校验 `package.json` 版本与标签一致；
2. 构建镜像（含 OCI 元数据标签）并推送 GHCR；
3. 对镜像做 `/api/health` 冒烟测试；
4. 生成 GitHub Release（自动更新说明 + 镜像拉取命令）。

也可以在 Actions 页面手动运行 **Release** 工作流并输入版本号（如 `v1.0.1`），会自动补建标签后发布。

> 发布前记得把变更写进 [CHANGELOG.md](../CHANGELOG.md)。

## 🐳 Docker 部署（推荐）

Docker 镜像已内置 Chromium 及全部字体依赖，开箱即用，服务器无需安装 Node.js。

### 方式一：直接拉取官方镜像（推荐）

```bash
# 只取编排文件即可，无需克隆整个仓库
curl -O https://raw.githubusercontent.com/bestZwei/WebSeal/main/docker-compose.yml
docker compose up -d

# 生产建议锁定版本
WEBSEAL_IMAGE=ghcr.io/bestzwei/webseal:1.0.0 docker compose up -d
```

或不用 compose，单条命令启动：

```bash
docker run -d --shm-size=256m -p 3000:3000 --name webseal-container ghcr.io/bestzwei/webseal:latest
docker logs -f webseal-container
```

### 方式二：从源码构建

```bash
# 构建镜像（VERSION 会写入镜像的 org.opencontainers.image.version 标签）
docker build -t webseal:latest --build-arg VERSION=1.0.0 .

# 运行容器（--shm-size 很关键，默认 64MB 会导致大页面截图崩溃）
docker run -d --shm-size=256m -p 3000:3000 --name webseal-container webseal:latest
```

也可以使用 npm 封装的快捷命令：

```bash
npm run docker:pull     # 拉取官方 latest 镜像
npm run docker:build    # 从源码构建
npm run docker:run
npm run docker:logs
npm run compose:up      # docker compose up -d
npm run compose:pull    # 更新镜像
npm run compose:logs
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

### 升级与回滚

```bash
# 升级到最新版
docker compose pull && docker compose up -d

# 回滚到指定版本
WEBSEAL_IMAGE=ghcr.io/bestzwei/webseal:1.0.0 docker compose up -d
```

### docker-compose.yml 说明

```yaml
services:
  webseal:
    # 预构建镜像；用 WEBSEAL_IMAGE 环境变量覆盖即可锁定版本
    image: ${WEBSEAL_IMAGE:-ghcr.io/bestzwei/webseal:latest}
    ports:
      - "3000:3000"           # 宿主机端口:容器端口，改左侧可换端口
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    mem_limit: 1g             # Puppeteer 截图比较吃内存，建议至少 1g
    mem_reservation: 512m
    shm_size: 256m            # Chrome 需要足够的 /dev/shm
    healthcheck:
      # alpine 镜像没有 curl，使用 busybox 自带的 wget
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
```

密钥等可选配置见 `.env.example`，复制为 `.env` 后取消 compose 中 `env_file` 的注释即可生效。

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
