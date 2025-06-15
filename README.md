# WebSeal - 专业网页快照存证工具

WebSeal 是一个基于 Cloudflare Pages 的专业网页快照存证工具，支持隐形水印和可视水印技术，为网页内容提供可靠的存证服务。

## 🌟 核心功能

- **网页快照**: 高质量网页截图生成
- **隐形水印**: 基于 LSB 隐写术的不可见水印
- **可视水印**: 可定制的透明水印标识
- **水印提取**: 从图片中提取隐藏的水印信息
- **存证验证**: 验证水印完整性和真实性
- **云端存储**: 基于 Cloudflare R2 的安全存储

## 🚀 快速开始

### 前提条件

- Cloudflare 账户
- Node.js 18+ 
- Git

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/WebSeal.git
cd WebSeal
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:8788`

## 📦 Cloudflare 部署

### 方法一：使用 Wrangler CLI (推荐)

1. **安装 Wrangler**
```bash
npm install -g wrangler
```

2. **登录 Cloudflare**
```bash
wrangler login
```

3. **创建 Pages 项目**
```bash
wrangler pages project create webseal
```

4. **配置环境变量**
```bash
# 生产环境
wrangler pages secret put BROWSERLESS_API_KEY --env production
# 输入你的 Browserless API Key (可选)
```

5. **部署应用**
```bash
npm run deploy
```

### 方法二：GitHub 集成部署

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **在 Cloudflare Dashboard 中创建 Pages 项目**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 选择 "Pages" → "Create a project"
   - 连接 GitHub 仓库
   - 设置构建配置：
     - 构建命令: `npm run build`
     - 构建输出目录: `.`
     - 根目录: `/`

3. **配置环境变量**
   - 在 Pages 项目设置中添加环境变量
   - `ENVIRONMENT`: `production`
   - `BROWSERLESS_API_KEY`: 你的 API Key (可选)

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `ENVIRONMENT` | 运行环境 | 是 | `development` |
| `BROWSERLESS_API_KEY` | Browserless API 密钥 | 否 | - |

### Browserless 服务配置

为了获得真实的网页截图，建议配置 Browserless 服务：

1. 注册 [Browserless](https://www.browserless.io/) 账户
2. 获取 API Key
3. 在 Cloudflare Pages 环境变量中设置 `BROWSERLESS_API_KEY`

> 如果不配置 Browserless，系统将生成占位符截图用于演示。

## 🎯 使用指南

### 网页快照

1. **输入网页地址**
   - 在"网页快照"标签页输入目标网页 URL
   - 支持 HTTP 和 HTTPS 协议

2. **配置水印选项**
   - **隐形水印**: 不可见的数字水印，用于存证
   - **可视水印**: 可见的透明标识
   - **自定义文字**: 添加自定义水印文本
   - **强度设置**: 调整隐形水印的嵌入强度

3. **生成快照**
   - 点击"开始快照"按钮
   - 等待处理完成
   - 查看结果并下载

### 水印提取

1. **上传图片**
   - 在"水印提取"标签页上传图片
   - 支持拖拽上传
   - 支持 PNG、JPG 等常见格式

2. **提取水印**
   - 点击"提取水印"按钮
   - 系统自动检测和提取隐藏水印
   - 显示水印信息和验证结果

## 🛠️ 技术架构

### 前端技术栈
- **HTML5**: 语义化结构
- **CSS3**: 现代样式和响应式设计
- **Vanilla JavaScript**: 轻量级交互逻辑
- **Font Awesome**: 图标库

### 后端技术栈
- **Cloudflare Pages Functions**: 无服务器后端
- **Canvas API**: 图像处理
- **LSB 隐写术**: 隐形水印算法
- **Browserless API**: 网页截图服务

### 存储和 CDN
- **Cloudflare R2**: 对象存储
- **Cloudflare CDN**: 全球内容分发

## 🔒 安全特性

### 水印安全
- **多强度嵌入**: 支持低、中、高强度水印
- **完整性验证**: 自动验证水印数据完整性
- **时间戳保护**: 防止时间篡改
- **URL 验证**: 确保源 URL 有效性

### 数据安全
- **客户端加密**: 敏感数据本地处理
- **HTTPS 传输**: 全程加密传输
- **短期存储**: 自动清理临时文件

## 📊 API 接口

### 快照生成 API

```http
POST /api/capture
Content-Type: application/json

{
  "url": "https://example.com",
  "enableInvisibleWatermark": true,
  "enableVisibleWatermark": false,
  "customText": "自定义文字",
  "invisibleStrength": "medium",
  "visiblePosition": "bottom-right",
  "visibleOpacity": 30,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 水印提取 API

```http
POST /api/extract
Content-Type: multipart/form-data

image: [图片文件]
```

## 🚦 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 水印未找到 |
| 500 | 服务器内部错误 |

## 🔧 故障排除

### 常见问题

**Q: 快照生成失败**
- 检查网址是否可访问
- 确认网址格式正确
- 检查网络连接

**Q: 水印提取失败**
- 确认图片包含 WebSeal 水印
- 检查图片格式是否支持
- 尝试不同的图片质量

**Q: 部署失败**
- 检查 Wrangler 配置
- 确认 Cloudflare 账户权限
- 查看部署日志

### 日志查看

```bash
# 查看实时日志
wrangler pages deployment tail

# 查看函数日志
wrangler pages functions logs
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-01)
- 🎉 初始版本发布
- ✨ 支持网页快照功能
- ✨ 支持隐形和可视水印
- ✨ 支持水印提取验证
- 🚀 Cloudflare Pages 部署支持

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **项目主页**: https://github.com/your-username/WebSeal
- **问题反馈**: https://github.com/your-username/WebSeal/issues
- **邮箱**: support@webseal.dev

## 🙏 致谢

- [Cloudflare Pages](https://pages.cloudflare.com/) - 提供优秀的托管服务
- [Browserless](https://www.browserless.io/) - 提供网页截图 API
- [Font Awesome](https://fontawesome.com/) - 提供精美图标

---

**WebSeal** - 让网页存证更简单、更安全 🛡️