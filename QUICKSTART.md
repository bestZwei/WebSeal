# WebSeal 快速启动指南

## 🚀 5分钟快速上手

### 方法一：本地运行（推荐新手）

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
打开浏览器访问: http://localhost:3000

### 方法二：一键部署到 Vercel（推荐部署）

1. **点击部署按钮**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/WebSeal)

2. **登录 Vercel 账户**（免费注册）

3. **确认部署**，几分钟后获得在线地址

### 方法三：Docker 部署（推荐生产环境）

1. **确保已安装 Docker**

2. **一键启动**
```bash
docker-compose up -d
```

3. **访问应用**
http://localhost:3000

## 📋 基础使用

### 生成网页快照

1. 在主页选择"网页截图与水印"
2. 输入网址，如：`https://www.example.com`
3. 可选：输入自定义文字，如：`存证时间：2025-06-15`
4. 点击"生成水印快照"
5. 等待10-30秒，完成后点击"下载快照"

### 验证水印

1. 选择"水印提取验证"标签
2. 上传之前生成的截图文件
3. 系统自动提取并显示水印信息
4. 验证时间戳和自定义文字是否正确

## 🔧 故障排除

### 常见问题

**Q: npm install 失败**
A: 确保 Node.js 版本 ≥ 18，使用 `npm cache clean --force` 清理缓存

**Q: 截图失败**
A: 检查网址是否正确，确保目标网站可访问

**Q: Docker 启动失败**
A: 确保 Docker 服务正在运行，端口3000未被占用

**Q: Vercel 部署失败**
A: 检查 GitHub 仓库是否公开，确保所有文件已提交

### 获取帮助

- 📖 详细文档：查看 `README.md`
- 🚀 部署指南：查看 `docs/DEPLOYMENT.md`
- 💡 使用示例：查看 `docs/EXAMPLES.md`
- 🐛 问题反馈：GitHub Issues

## 🎯 下一步

- 体验完整功能后，阅读详细文档了解高级用法
- 根据需要选择合适的部署方案
- 参考使用示例了解不同应用场景
- 考虑自定义配置和扩展功能

---

开始你的网页存证之旅吧！ 🚀
