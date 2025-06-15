# WebSeal

<div align="center">
  <img src="docs/images/logo.png" alt="WebSeal Logo" width="120" height="120">
  <h1>WebSeal</h1>
  <p>专业的网页快照水印存证系统</p>
  
  [![Docker Image](https://img.shields.io/docker/v/webseal/webseal?style=flat-square)](https://hub.docker.com/r/webseal/webseal)
  [![License](https://img.shields.io/github/license/webseal/webseal?style=flat-square)](LICENSE)
  [![Build Status](https://img.shields.io/github/actions/workflow/status/webseal/webseal/docker-build.yml?branch=main&style=flat-square)](https://github.com/webseal/webseal/actions)
</div>

## 🚀 功能特性

- **🌐 网页快照**: 高质量全页面截图，支持复杂页面结构
- **🔒 隐形水印**: 基于LSB算法的不可见水印技术
- **🕒 时间戳**: 精确的时间戳记录，确保证据时效性
- **🔍 水印检测**: 快速检测和提取隐藏的水印信息
- **📁 存证管理**: 完整的存证记录管理系统
- **⚡ 高性能**: 优化的处理引擎，支持并发处理
- **🔌 API接口**: 完整的RESTful API支持
- **🐳 Docker部署**: 支持容器化部署和自动扩展

## 📋 目录

- [快速开始](#-快速开始)
- [安装部署](#-安装部署)
- [功能介绍](#-功能介绍)
- [API文档](#-api文档)
- [配置说明](#-配置说明)
- [开发指南](#-开发指南)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 🏃 快速开始

### 使用 Docker（推荐）

```bash
# 拉取镜像
docker pull webseal/webseal:latest

# 运行容器
docker run -d \
  --name webseal \
  -p 3000:3000 \
  -v $(pwd)/data:/app/server/data \
  -v $(pwd)/uploads:/app/server/uploads \
  webseal/webseal:latest
```

### 使用 Docker Compose

```bash
# 克隆项目
git clone https://github.com/webseal/webseal.git
cd webseal

# 启动服务
docker-compose up -d
```

访问 `http://localhost:3000` 开始使用！

## 🛠 安装部署

### 系统要求

- **操作系统**: Linux、macOS、Windows
- **Node.js**: ≥ 18.0.0
- **内存**: ≥ 2GB
- **存储**: ≥ 10GB

### 手动部署

#### 1. 环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装系统依赖（Ubuntu/Debian）
sudo apt-get update
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
  libxtst6 ca-certificates fonts-liberation libappindicator1 \
  libnss3 lsb-release xdg-utils wget
```

#### 2. 项目部署

```bash
# 克隆项目
git clone https://github.com/webseal/webseal.git
cd webseal

# 安装依赖
npm install

# 构建前端
cd client
npm install
npm run build
cd ..

# 安装后端依赖
cd server
npm install
cd ..

# 启动服务
npm start
```

### 环境变量配置

创建 `.env` 文件：

```env
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库配置（可选）
DATABASE_URL=sqlite:./data/webseal.db

# 存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Puppeteer 配置
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox

# 安全配置
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=*

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/webseal.log
```

## 💡 功能介绍

### 网页快照

WebSeal 使用 Puppeteer 和 Chromium 引擎生成高质量的网页截图：

- **全页面截图**: 自动检测页面高度，生成完整截图
- **高分辨率**: 支持 4K 分辨率输出
- **智能等待**: 自动等待页面加载完成
- **移动端适配**: 支持移动端视窗模拟

### 隐形水印技术

采用先进的 LSB（最低有效位）隐写术：

- **不可见性**: 水印完全不可见，不影响图片质量
- **鲁棒性**: 抗压缩、抗噪声干扰
- **容量大**: 可嵌入大量水印信息
- **安全性**: 加密存储，防止恶意提取

### 水印信息

每个水印包含以下信息：

```json
{
  "watermark": "WebSeal - 2024-01-15T10:30:45.123Z",
  "custom": "用户自定义文字",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "signature": "WEBSEAL_WATERMARK"
}
```

### 存证管理

- **记录追踪**: 完整的操作日志
- **批量管理**: 支持批量操作
- **数据导出**: 支持多种格式导出
- **搜索过滤**: 强大的搜索和过滤功能

## 📖 API文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token（可选）
- **数据格式**: JSON

### 接口列表

#### 1. 健康检查

```http
GET /api/health
```

**响应示例:**
```json
{
  "status": "ok",
  "message": "WebSeal server is running"
}
```

#### 2. 网页截图

```http
POST /api/screenshot
```

**请求参数:**
```json
{
  "url": "https://example.com",
  "watermarkText": "WebSeal - 2024-01-15T10:30:45.123Z",
  "customText": "自定义水印文字",
  "quality": 90,
  "width": 1920,
  "delay": 2000
}
```

**响应示例:**
```json
{
  "success": true,
  "id": "uuid-string",
  "url": "https://example.com",
  "originalImage": "/uploads/screenshot-original.png",
  "watermarkedImage": "/uploads/screenshot-watermarked.png",
  "watermarkText": "WebSeal - 2024-01-15T10:30:45.123Z",
  "customText": "自定义水印文字",
  "createdAt": "2024-01-15T10:30:45.123Z"
}
```

#### 3. 水印检测

```http
POST /api/detect-watermark
Content-Type: multipart/form-data
```

**请求参数:**
- `image`: 图片文件

**响应示例:**
```json
{
  "success": true,
  "filename": "uploaded-image.png",
  "watermarkDetected": true,
  "watermarkText": "WebSeal - 2024-01-15T10:30:45.123Z",
  "customText": "自定义水印文字",
  "confidence": 0.95
}
```

#### 4. 获取记录列表

```http
GET /api/records?page=1&limit=10
```

**响应示例:**
```json
{
  "records": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 错误处理

所有 API 错误都遵循统一格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息",
  "code": "ERROR_CODE"
}
```

常见错误码：

- `400`: 请求参数错误
- `401`: 未授权访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## ⚙️ 配置说明

### 服务器配置

```javascript
// server/config/default.js
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu'
    ]
  },
  watermark: {
    algorithm: 'LSB',
    strength: 1
  },
  storage: {
    uploadDir: './uploads',
    maxFileSize: 10 * 1024 * 1024 // 10MB
  }
}
```

### 数据库配置

支持 SQLite（默认）和 PostgreSQL：

```javascript
// SQLite 配置
database: {
  type: 'sqlite',
  path: './data/webseal.db'
}

// PostgreSQL 配置
database: {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'webseal',
  username: 'webseal',
  password: 'password'
}
```

## 👨‍💻 开发指南

### 开发环境搭建

```bash
# 克隆项目
git clone https://github.com/webseal/webseal.git
cd webseal

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 项目结构

```
webseal/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── views/         # 页面
│   │   ├── utils/         # 工具函数
│   │   └── assets/        # 静态资源
│   └── package.json
├── server/                 # 后端应用
│   ├── src/
│   │   ├── services/      # 业务服务
│   │   ├── routes/        # 路由
│   │   ├── models/        # 数据模型
│   │   └── utils/         # 工具函数
│   └── package.json
├── docs/                   # 文档
├── docker-compose.yml      # Docker编排
├── Dockerfile             # Docker构建
└── README.md
```

### 技术栈

**前端:**
- Vue.js 3 + Composition API
- Element Plus UI框架
- Tailwind CSS 样式框架
- Vite 构建工具

**后端:**
- Node.js + Express
- Puppeteer 浏览器自动化
- Sharp/Jimp 图像处理
- SQLite 数据库

### 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Git Flow 分支管理策略
- 编写单元测试和集成测试

### 调试技巧

```bash
# 启用调试模式
DEBUG=webseal:* npm run dev

# Puppeteer 调试
PUPPETEER_DEBUG=true npm run dev

# 数据库调试
DATABASE_DEBUG=true npm run dev
```

## ❓ 常见问题

### Q: 截图时出现超时错误？

A: 检查以下几点：
1. 确保目标网站可正常访问
2. 增加 `delay` 参数值
3. 检查服务器内存是否充足
4. 确保 Chromium 正确安装

### Q: 水印检测失败？

A: 可能的原因：
1. 图片已被压缩或处理
2. 图片格式不支持
3. 不是通过 WebSeal 生成的图片
4. 水印信息已损坏

### Q: Docker 容器启动失败？

A: 检查以下配置：
1. 确保 Docker 版本 ≥ 20.10
2. 检查端口是否被占用
3. 确保有足够的磁盘空间
4. 查看容器日志: `docker logs webseal`

### Q: 如何自定义水印算法？

A: 修改 `server/services/watermarkService.js` 文件：

```javascript
// 自定义水印算法
class CustomWatermarkService {
  async addWatermark(imagePath, watermarkData) {
    // 实现自定义算法
  }
  
  async detectWatermark(imagePath) {
    // 实现检测逻辑
  }
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告 Bug**: 在 [Issues](https://github.com/webseal/webseal/issues) 中报告问题
2. **功能建议**: 提出新功能的想法和建议
3. **代码贡献**: 提交 Pull Request
4. **文档改进**: 改进文档和示例

### 开发流程

1. Fork 项目到你的 GitHub 账号
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

### 代码规范

- 遵循现有的代码风格
- 添加必要的注释和文档
- 编写测试用例
- 确保所有测试通过

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 📧 联系我们

- **项目地址**: https://github.com/webseal/webseal
- **问题反馈**: https://github.com/webseal/webseal/issues
- **邮箱**: support@webseal.com
- **官网**: https://webseal.com

## 🙏 致谢

感谢以下开源项目：

- [Puppeteer](https://github.com/puppeteer/puppeteer) - 浏览器自动化
- [Vue.js](https://github.com/vuejs/core) - 前端框架
- [Element Plus](https://github.com/element-plus/element-plus) - UI 组件库
- [Express](https://github.com/expressjs/express) - Web 框架
- [Sharp](https://github.com/lovell/sharp) - 图像处理

---

<div align="center">
  <p>如果这个项目对你有帮助，请给它一个 ⭐️</p>
  <p>Made with ❤️ by WebSeal Team</p>
</div>
