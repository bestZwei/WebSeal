# WebSeal - 专业的网页快照与水印工具


## 📖 项目简介

WebSeal 是一款专业的网页快照与水印工具，采用先进的 LSB（最低有效位）盲水印技术，为网页快照添加时间戳和自定义文字水印，便于网页内容的归档留痕与事后核对。适用于网页归档、内容留痕、变更记录等场景。

### 🌟 核心特性

- **🔒 盲水印技术**: 使用 LSB 隐写算法，水印信息肉眼不可见
- **⏰ 时间戳留痕**: 自动嵌入精确的时间戳，记录快照生成时间
- **📝 自定义文字**: 支持添加公司名称、存档编号等自定义信息
- **🖼️ 高质量截图**: 基于 Puppeteer 的全页面截图功能
- **🔍 水印提取**: 完整的水印信息提取和验证功能
- **🐳 服务器部署**: 支持 Docker 一键部署，数据完全自持
- **📱 响应式设计**: 完美适配桌面端和移动端
- **🚀 高性能**: 优化的算法确保快速处理

## 🛠️ 技术栈

- **前端框架**: Next.js 15.3.3 + React 19
- **样式框架**: Tailwind CSS 4.0
- **编程语言**: TypeScript
- **截图引擎**: Puppeteer
- **图像处理**: Sharp
- **水印算法**: LSB (Least Significant Bit) 隐写术
- **UI 组件**: Radix UI + Lucide React
- **部署方式**: Docker / 自托管服务器

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 或 pnpm

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/WebSeal.git
cd WebSeal
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

## 🌐 部署

> 本项目仅支持服务器部署（Docker 或裸机运行），不支持 Vercel 等 Serverless 平台——因为 Puppeteer 需要完整的 Chrome 浏览器环境。

### Docker 部署（推荐）

官方镜像托管在 GHCR，服务器无需安装 Node.js / Chromium。

1. **拉取预构建镜像并启动（最省事）**

```bash
# 只取编排文件，直接拉镜像启动
curl -O https://raw.githubusercontent.com/bestZwei/WebSeal/main/docker-compose.yml
docker compose up -d

# 锁定版本（推荐生产环境，避免 latest 意外升级）
WEBSEAL_IMAGE=ghcr.io/bestzwei/webseal:1.0.0 docker compose up -d
```

可用镜像标签：`1.0.0`（精确版本）、`1.0`（小版本线）、`latest`。

2. **手动运行镜像**

```bash
docker pull ghcr.io/bestzwei/webseal:latest
docker run -d --shm-size=256m -p 3000:3000 --name webseal ghcr.io/bestzwei/webseal:latest
```

3. **从源码构建镜像**

```bash
npm run docker:build   # 等同于 docker build -t webseal:latest .（CI 发版时会注入 --build-arg VERSION）
npm run docker:run
```

4. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)；健康检查：`curl http://localhost:3000/api/health`

### 裸机部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

> 注意：生产环境需要系统安装 Chrome/Chromium。Linux 服务器上 Puppeteer 默认查找 `/usr/bin/chromium-browser`。

详细的部署说明（含环境变量、反向代理配置、故障排除）见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 📋 功能使用指南

### 网页快照生成

1. **输入网址**
   - 在"目标网址"输入框中输入完整的网址
   - 支持 HTTP 和 HTTPS 协议
   - 例如：`https://example.com`

2. **添加自定义水印（可选）**
   - 可以输入公司名称、存档编号、备注信息等
   - 建议不超过 100 个字符以确保水印质量

3. **生成快照**
   - 点击"生成水印快照"按钮
   - 等待页面加载和截图完成（通常需要 10-30 秒）
   - 系统会自动嵌入时间戳和自定义文字水印

4. **下载保存**
   - 生成成功后可以预览快照
   - 点击"下载快照"保存到本地
   - 文件名会自动包含域名和时间戳

### 水印提取验证

1. **上传图片**
   - 点击上传区域选择图片文件
   - 或直接拖拽图片到上传区域
   - 仅支持 PNG 格式（水印在 JPEG 等有损压缩格式中会被破坏），最大 10MB

2. **提取水印**
   - 系统会自动分析图片中的水印信息
   - 提取包括时间戳、自定义文字、原始网址等

3. **验证结果**
   - 显示提取到的所有水印信息
   - 可以复制原始网址进行验证
   - 确认图片的真实性和完整性

## 🔧 API 接口

### 截图接口

**POST** `/api/screenshot`

请求体：
```json
{
  "url": "https://example.com",
  "customText": "自定义文字（可选）"
}
```

响应：
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2025-06-15T10:30:00.000Z",
  "originalUrl": "https://example.com",
  "customText": "自定义文字"
}
```

### 水印提取接口

**POST** `/api/extract-watermark`

请求体：FormData 包含图片文件

响应：
```json
{
  "success": true,
  "timestamp": "2025-06-15T10:30:00.000Z",
  "customText": "自定义文字",
  "url": "https://example.com",
  "extractedAt": "2025-06-15T10:35:00.000Z"
}
```

## 🔐 水印技术详解

### LSB 隐写算法

WebSeal 采用 LSB（Least Significant Bit）算法实现盲水印：

1. **嵌入过程**
   - 将水印信息转换为二进制数据
   - 修改图像像素的最低有效位
   - 添加结束标记确保数据完整性

2. **提取过程**
   - 读取图像像素的最低有效位
   - 重组二进制数据为原始信息
   - 验证数据完整性和有效性

3. **优势特点**
   - **不可见性**: 水印信息肉眼完全不可见
   - **完整性**: 包含时间戳、文字、URL 等完整信息
   - **安全性**: 需要专门算法才能提取
   - **鲁棒性**: 对常见图像操作具有一定抗性

### 水印信息结构

```json
{
  "timestamp": "ISO 8601 格式时间戳",
  "customText": "用户自定义文字",
  "url": "原始网页 URL",
  "version": "水印版本号"
}
```

### 防伪签名（Ed25519）

自 v2.0 水印格式起，服务端会对水印内容（时间戳 + 自定义文字 + URL）进行 Ed25519 签名后一并嵌入图片。验证时可以确认：

- **不可伪造**：没有私钥无法制造能通过验证的"本服务签发"水印
- **防篡改**：水印任一字段被改动，验签即失败

签名密钥仅从环境变量读取（生成方式：`node scripts/generate-keys.mjs`）：

| 环境变量 | 说明 |
| --- | --- |
| `WEBSEAL_PRIVATE_KEY` | 签发用私钥（PKCS8 PEM），不配置则水印以未签名模式嵌入 |
| `WEBSEAL_PUBLIC_KEY` | 验证用公钥（SPKI PEM），可省略——会自动从私钥推导 |

公钥及指纹通过 `GET /api/public-key` 公示，验证方可核对指纹确认服务身份。

> 注意：签名证明的是"签发来源与内容完整性"，不证明时间的真实性（需可信时间戳 TSA 支撑）。

### 可信时间戳（RFC 3161 TSA）

配置 `WEBSEAL_TSA_URL` 后，服务端会对最终快照 PNG 的 SHA-256 哈希向独立时间戳机构请求背书，
获得"该哈希在 genTime 时刻已存在"的权威证明：

- **时间可信**：时间戳由第三方 TSA 签发，不由本服务自说自话
- **完整性绑定**：凭证中的哈希与图片一致，即证明图片自背书时刻起未被修改
- **凭证随行**：生成快照时可下载 `.tsa.json` 凭证文件，提取验证时上传即可核对

| 环境变量 | 说明 |
| --- | --- |
| `WEBSEAL_TSA_URL` | TSA 服务地址（RFC 3161），如 `https://freetsa.org/tsr`；不配置则功能关闭 |
| `WEBSEAL_TSA_REQUIRED` | 设为 `true` 时 TSA 请求失败会导致截图失败；默认 best-effort 降级 |

> 凭证内容的完整信任链验证（TSA 证书校验）可用 `openssl ts -verify` 离线复核。


## 🎯 使用场景

### 内容留痕

- **电商页面**: 留存商品页面与价格信息
- **条款变更**: 记录在线条款、规则的历史版本
- **原创内容**: 为原创内容生成带时间戳的快照
- **广告投放**: 留存投放中的广告文案与素材

### 网页归档

- **重要公告**: 保存官方公告和声明
- **新闻报道**: 归档重要新闻内容
- **技术文档**: 备份技术资料和教程
- **政策法规**: 保存法规政策文件

### 内容保护

- **原创保护**: 记录内容发布时的页面状态
- **版权留痕**: 为原创作品留存带时间戳的快照
- **数据备份**: 重要网页数据备份
- **历史记录**: 建立网页变更历史

## ⚠️ 注意事项

### 使用限制

- **文件大小**: 上传图片最大 10MB
- **网址要求**: 必须是有效的 HTTP/HTTPS 地址
- **截图超时**: 单次截图最长 30 秒
- **系统要求**: 生产环境需安装 Chrome/Chromium（Docker 镜像已内置）

### 免责声明

- 本工具仅用于合法的网页归档与内容留痕目的
- 用户需确保截图内容不违反相关法律法规
- 请遵守目标网站的 robots.txt 和使用条款
- 本工具只提供技术层面的快照记录（时间戳 + 盲水印 + 可选签名/时间戳凭证），
  **不构成法律证据、公证或任何形式的法律保证**，如需具备法律效力的证明请咨询专业机构

### 隐私保护

- 本工具不存储用户上传的图片
- 截图过程不保存任何敏感信息
- 所有处理均在服务器端完成后立即销毁
- 建议在本地部署以确保数据安全

## 🔧 故障排除

### 常见问题

**Q: 截图失败怎么办？**
A: 检查网址是否正确，确保目标网站可以正常访问，部分网站可能有反爬虫保护。

**Q: 水印提取失败？**
A: 确保图片是通过 WebSeal 生成的，且没有经过大幅度压缩或格式转换。

**Q: 部署失败？**
A: 检查 Node.js 版本是否符合要求，确保所有依赖正确安装；生产环境需确认 Chrome/Chromium 已安装（推荐使用 Docker 部署，镜像内已内置）。

**Q: 截图不完整？**
A: 部分动态网页可能需要更长加载时间，可以尝试多次截图。

### 性能优化

1. **图片大小**: 建议上传用于水印提取的图片大小适中
2. **网络环境**: 确保网络稳定以获得最佳截图效果
3. **浏览器兼容**: 建议使用现代浏览器以获得最佳体验

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 开发贡献

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 问题反馈

- 使用 [GitHub Issues](https://github.com/your-username/WebSeal/issues) 报告 Bug
- 提供详细的错误信息和复现步骤
- 建议新功能和改进

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 配置
- 保持代码整洁和良好注释
- 编写必要的测试用例

## 📄 许可证

本项目基于 [Anti-Capitalist Software License (v 1.4)](LICENSE) 开源协议。

## 👥 团队

- **WebSeal Team** - 项目维护和开发

## 🙏 致谢

感谢以下开源项目的支持：

- [Next.js](https://nextjs.org/) - React 框架
- [Puppeteer](https://pptr.dev/) - 浏览器自动化
- [Sharp](https://sharp.pixelplumbing.com/) - 图像处理
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库

## 📞 联系我们

- **项目主页**: https://github.com/your-username/WebSeal
- **问题反馈**: https://github.com/your-username/WebSeal/issues

---

**WebSeal** - 让网页快照更专业、更可靠！ 🚀
