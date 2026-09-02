# 更新日志

本项目所有值得记录的变更都会写在这里。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)：`主版本.次版本.修订号`。

## 版本与镜像的对应关系

每次发版（`npm run release:patch|minor|major` 后推送标签）会自动：

1. 构建 Docker 镜像并推送到 GHCR：`ghcr.io/bestzwei/webseal:<版本>`
2. 同时打上 `<主版本>.<次版本>` 与 `latest` 标签
3. 生成 GitHub Release（含更新说明与镜像拉取命令）

部署时用 `WEBSEAL_IMAGE` 指定镜像标签即可锁定版本，详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## [Unreleased]

### 新增

- GitHub Actions 发布工作流：推送 `v*.*.*` 标签自动构建并推送 Docker 镜像、创建 Release
- GitHub Actions CI 工作流：lint / 类型检查 / 构建 + Docker 镜像健康接口冒烟测试
- Dockerfile 增加 OCI 元数据标签（版本、来源、许可证、构建时间）与分阶段中文注释
- docker-compose.yml 改为默认拉取 GHCR 预构建镜像，支持 `WEBSEAL_IMAGE` 锁定版本，新增 `shm_size`
- 新增 `render.yaml`（Render 一键部署）与 `.env.example` 配置模板
- 新增本文件（CHANGELOG.md）

## [1.0.0]

首个正式版本。

### 新增

- 基于 LSB 隐写的盲水印嵌入与提取
- Puppeteer 全页面截图，支持自定义文字水印
- Ed25519 水印签名（可通过 `WEBSEAL_PRIVATE_KEY` 开启）
- RFC 3161 可信时间戳（可通过 `WEBSEAL_TSA_URL` 开启）
- SSRF 防护（协议/凭证/主机名 + DNS 解析双重校验）
- Docker / docker-compose 部署支持
