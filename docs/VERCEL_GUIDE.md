# Vercel 部署快速指南

## 🚀 一键部署

### 方法1：GitHub 集成（推荐）

1. **Fork 项目到你的 GitHub**
   - 点击项目页面的 "Fork" 按钮
   - 或者克隆后推送到你的仓库

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录
   - 点击 "New Project"
   - 选择 WebSeal 仓库

3. **配置项目**
   - 项目名称：`webseal` 或自定义
   - Framework Preset: Next.js（自动检测）
   - Root Directory: `./`（默认）
   - 保持其他设置为默认值

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待 2-3 分钟完成构建
   - 获得 `https://your-project.vercel.app` 域名

### 方法2：CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd WebSeal
   vercel --prod
   ```

## ⚙️ 配置说明

### vercel.json 配置

```json
{
  "functions": {
    "src/app/api/screenshot/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/extract-watermark/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/health/route.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["hkg1", "sin1", "sfo1"]
}
```

**配置说明：**
- `maxDuration`: API 函数最大执行时间（秒）
- `regions`: 部署区域，选择离用户近的区域

### 环境变量（可选）

在 Vercel 项目设置中可以添加：

```
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## 🔧 常见问题

### 1. 构建失败

**错误信息：**
```
Build failed with exit code 1
```

**解决方案：**
- 检查 `package.json` 中的依赖版本
- 确保所有文件都已提交到 Git
- 本地运行 `npm run build` 确认无误

### 2. 函数超时

**错误信息：**
```
Task timed out after 10.00 seconds
```

**解决方案：**
- 检查 `vercel.json` 中的 `maxDuration` 设置
- 考虑升级到 Vercel Pro 计划
- 优化目标网站的加载速度

### 3. Puppeteer 错误

**错误信息：**
```
Error: Failed to launch the browser process
```

**解决方案：**
- 项目已配置 Puppeteer 参数，通常会自动解决
- 如果仍有问题，检查目标网站是否有反爬虫保护

### 4. 内存不足

**错误信息：**
```
Process out of memory
```

**解决方案：**
- 升级到 Vercel Pro 计划（推荐）
- 减少并发请求
- 优化图片处理参数

## 📊 性能优化

### 1. 冷启动优化

Vercel 无服务器函数存在冷启动，首次请求可能较慢：

- **预热策略**: 使用定时任务定期请求 API
- **缓存策略**: 合理设置缓存头
- **代码分割**: 已通过 Next.js 自动优化

### 2. 区域选择

选择合适的部署区域：

- **亚洲用户**: `hkg1` (香港), `sin1` (新加坡)
- **美国用户**: `sfo1` (旧金山), `iad1` (华盛顿)
- **欧洲用户**: `lhr1` (伦敦), `fra1` (法兰克福)

### 3. 监控和分析

启用 Vercel Analytics：

1. 在项目设置中启用 Analytics
2. 监控函数执行时间
3. 分析用户访问模式
4. 优化性能瓶颈

## 🔒 安全配置

### 1. 域名配置

添加自定义域名：

1. 在项目设置中点击 "Domains"
2. 添加你的域名
3. 配置 DNS 记录
4. 启用 HTTPS（自动）

### 2. 环境保护

保护生产环境：

- 设置 Preview 分支保护
- 配置 Deployment Protection
- 启用 Password Protection（如需要）

### 3. 访问控制

限制 API 访问：

```javascript
// 可以添加 IP 白名单或 API 密钥验证
const allowedOrigins = ['https://your-domain.com'];
```

## 📈 扩展功能

### 1. 数据库集成

连接数据库（如 Vercel KV）：

```bash
vercel kv create webseal-db
```

### 2. 监控告警

集成监控服务：

- Vercel Analytics
- Sentry 错误监控
- 自定义日志收集

### 3. CDN 优化

利用 Vercel Edge Network：

- 静态资源自动 CDN
- Edge Functions 支持
- 全球加速

---

**部署成功后，你的 WebSeal 应用就可以为全球用户提供服务了！** 🌍

记住定期检查 Vercel 控制台中的函数执行情况和性能指标。
