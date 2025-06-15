# WebSeal 部署和使用指南

## 📋 目录

1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [详细部署](#详细部署)
4. [功能使用](#功能使用)
5. [配置说明](#配置说明)
6. [故障排除](#故障排除)
7. [升级维护](#升级维护)
8. [API集成](#api集成)

## 🔧 系统要求

### 硬件要求
- **CPU**: 2核心及以上
- **内存**: 4GB RAM 及以上
- **存储**: 20GB 可用空间
- **网络**: 稳定的网络连接

### 软件要求
- **操作系统**: Linux (Ubuntu 20.04+)、macOS、Windows
- **Docker**: 20.10+ 版本
- **Docker Compose**: 2.0+ 版本
- **浏览器**: Chrome 90+、Firefox 88+、Safari 14+

## 🚀 快速部署

### 使用 Docker（推荐）

```bash
# 1. 拉取镜像
docker pull webseal/webseal:latest

# 2. 创建数据目录
mkdir -p ./webseal-data/{data,uploads,logs}

# 3. 运行容器
docker run -d \
  --name webseal \
  -p 3000:3000 \
  -v $(pwd)/webseal-data/data:/app/server/data \
  -v $(pwd)/webseal-data/uploads:/app/server/uploads \
  -v $(pwd)/webseal-data/logs:/app/server/logs \
  --restart unless-stopped \
  webseal/webseal:latest

# 4. 访问服务
echo "WebSeal 已启动，访问地址: http://localhost:3000"
```

### 使用 Docker Compose

```bash
# 1. 下载项目
git clone https://github.com/webseal/webseal.git
cd webseal

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f
```

## 📦 详细部署

### 环境准备

#### Ubuntu/Debian 系统

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

#### CentOS/RHEL 系统

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 部署配置

#### 1. 下载项目

```bash
# 从 GitHub 下载
git clone https://github.com/webseal/webseal.git
cd webseal

# 或者下载压缩包
wget https://github.com/webseal/webseal/archive/main.zip
unzip main.zip
cd webseal-main
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

关键配置项：

```env
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=sqlite:./data/webseal.db

# 存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 安全配置
JWT_SECRET=your_very_secure_jwt_secret_here
CORS_ORIGIN=*

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/webseal.log
```

#### 3. 生产环境配置

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  webseal:
    image: webseal/webseal:latest
    container_name: webseal
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/server/data
      - ./uploads:/app/server/uploads
      - ./logs:/app/server/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - webseal-network

  nginx:
    image: nginx:alpine
    container_name: webseal-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - webseal
    networks:
      - webseal-network

networks:
  webseal-network:
    driver: bridge
```

#### 4. 启动服务

```bash
# 使用自动部署脚本
chmod +x deploy.sh
./deploy.sh production latest

# 或者手动启动
docker-compose -f docker-compose.prod.yml up -d
```

### SSL 证书配置

#### 自签名证书（开发环境）

```bash
# 创建 SSL 目录
mkdir -p ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key \
  -out ssl/server.crt \
  -subj "/C=CN/ST=State/L=City/O=WebSeal/CN=localhost"
```

#### Let's Encrypt 证书（生产环境）

```bash
# 安装 Certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/server.key
sudo chown $(whoami):$(whoami) ssl/*

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 💡 功能使用

### 网页截图存证

1. **访问主页**
   - 打开浏览器访问 `http://localhost:3000`
   - 点击"开始截图存证"进入截图页面

2. **配置截图参数**
   ```
   网址: https://example.com
   时间水印: WebSeal - 2025-01-15T10:30:45.123Z (自动生成)
   自定义文字: 法律存证专用 (可选)
   截图质量: 90%
   视窗宽度: 1920px
   加载延迟: 2000ms
   ```

3. **生成截图**
   - 点击"开始截图存证"按钮
   - 系统将自动访问网页并生成截图
   - 同时生成原图和带水印版本

4. **下载结果**
   - 下载原始截图（无水印）
   - 下载水印版本（包含隐形水印）
   - 记录自动保存到数据库

### 水印检测验证

1. **上传图片**
   - 进入"水印检测"页面
   - 拖拽或点击上传图片文件
   - 支持 JPG、PNG、WEBP 格式

2. **检测水印**
   - 点击"开始检测水印"按钮
   - 系统自动分析图片像素
   - 提取隐藏的水印信息

3. **查看结果**
   ```
   检测状态: 检测到水印 / 未检测到水印
   时间戳水印: WebSeal - 2025-01-15T10:30:45.123Z
   自定义文字: 法律存证专用
   置信度: 95%
   ```

4. **导出报告**
   - 下载检测报告（TXT格式）
   - 复制水印信息到剪贴板

### 存证记录管理

1. **查看记录列表**
   - 进入"存证记录"页面
   - 查看所有截图记录
   - 支持搜索和筛选

2. **记录操作**
   - 预览：查看截图详情
   - 下载：下载图片文件
   - 检测：验证水印信息
   - 删除：删除记录和文件

3. **批量操作**
   - 选择多条记录
   - 批量下载图片
   - 批量删除记录

## ⚙️ 配置说明

### 环境变量详解

```env
# 基础配置
NODE_ENV=production          # 运行环境: development/production
PORT=3000                   # 服务端口

# 数据库配置
DATABASE_URL=sqlite:./data/webseal.db  # SQLite数据库路径
# DATABASE_URL=postgresql://user:pass@host:5432/dbname  # PostgreSQL

# 存储配置
UPLOAD_DIR=./uploads        # 上传文件目录
MAX_FILE_SIZE=10485760     # 最大文件大小 (10MB)

# Puppeteer 配置
PUPPETEER_EXECUTABLE_PATH=  # Chromium 可执行文件路径
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox

# 安全配置
JWT_SECRET=your_secret_key  # JWT 密钥
CORS_ORIGIN=*              # CORS 允许的源

# 日志配置
LOG_LEVEL=info             # 日志级别: error/warn/info/debug
LOG_FILE=./logs/webseal.log # 日志文件路径

# API 配置
API_RATE_LIMIT=100         # API 请求频率限制
API_TIMEOUT=60000          # API 超时时间 (毫秒)

# 水印配置
WATERMARK_ALGORITHM=LSB    # 水印算法
WATERMARK_STRENGTH=1       # 水印强度

# 清理配置
CLEANUP_DAYS=30           # 自动清理天数
CLEANUP_ENABLED=true      # 是否启用自动清理
```

### Nginx 配置

```nginx
# 基础配置
worker_processes auto;
worker_connections 1024;

# 限制配置
client_max_body_size 10M;  # 文件上传大小限制

# 限流配置
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

# 代理配置
upstream webseal_backend {
    server webseal:3000;
    keepalive 32;
}
```

### 数据库配置

#### SQLite（默认）
- 轻量级，适合中小型应用
- 数据文件存储在 `data/webseal.db`
- 自动创建表结构

#### PostgreSQL（高级）
```env
DATABASE_URL=postgresql://webseal:password@localhost:5432/webseal
```

```sql
-- 创建数据库
CREATE DATABASE webseal;
CREATE USER webseal WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE webseal TO webseal;
```

## 🔧 故障排除

### 常见问题

#### 1. 容器启动失败

**问题描述**: Docker 容器无法启动

**解决方案**:
```bash
# 查看容器日志
docker-compose logs webseal

# 检查端口占用
netstat -tlnp | grep 3000

# 检查磁盘空间
df -h

# 重新构建镜像
docker-compose build --no-cache
```

#### 2. 截图超时失败

**问题描述**: 网页截图时出现超时错误

**解决方案**:
```bash
# 增加内存限制
docker run --memory=2g webseal/webseal

# 调整环境变量
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage

# 增加延迟时间
# 在截图配置中设置更长的延迟时间
```

#### 3. 水印检测失败

**问题描述**: 无法检测到水印信息

**可能原因**:
- 图片已被压缩或处理
- 图片格式不支持
- 不是通过 WebSeal 生成的图片

**解决方案**:
- 使用原始质量的图片
- 检查图片格式是否为 PNG/JPG
- 确认图片来源

#### 4. 数据库连接错误

**问题描述**: 数据库连接失败

**解决方案**:
```bash
# 检查数据库文件权限
ls -la data/

# 修复权限问题
sudo chown -R 1001:1001 data/

# 重新初始化数据库
rm data/webseal.db
docker-compose restart webseal
```

### 性能优化

#### 1. 系统资源优化

```bash
# 增加容器内存限制
docker-compose.yml:
  services:
    webseal:
      deploy:
        resources:
          limits:
            memory: 2G
          reservations:
            memory: 1G
```

#### 2. Puppeteer 优化

```env
# 环境变量优化
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu,--disable-extensions
```

#### 3. 数据库优化

```sql
-- SQLite 优化
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000000;
PRAGMA temp_store = memory;
```

## 🔄 升级维护

### 版本升级

```bash
# 1. 备份数据
./deploy.sh backup

# 2. 拉取新版本
docker-compose pull

# 3. 停止服务
docker-compose down

# 4. 启动新版本
docker-compose up -d

# 5. 验证升级
curl http://localhost:3000/api/health
```

### 数据备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份数据库
cp data/webseal.db "$BACKUP_DIR/"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads/

# 备份配置文件
cp .env "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/"

echo "备份完成: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

### 数据恢复

```bash
# 恢复脚本
cat > restore.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$1"

if [ -z "$BACKUP_DIR" ]; then
    echo "用法: ./restore.sh <备份目录>"
    exit 1
fi

# 停止服务
docker-compose down

# 恢复数据库
cp "$BACKUP_DIR/webseal.db" data/

# 恢复上传文件
tar -xzf "$BACKUP_DIR/uploads.tar.gz"

# 启动服务
docker-compose up -d

echo "恢复完成"
EOF

chmod +x restore.sh
```

### 日志管理

```bash
# 日志轮转配置
cat > /etc/logrotate.d/webseal << 'EOF'
/path/to/webseal/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart webseal
    endscript
}
EOF
```

### 监控告警

```bash
# 健康检查脚本
cat > health_check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/api/health"
ALERT_EMAIL="admin@example.com"

if ! curl -f "$HEALTH_URL" &> /dev/null; then
    echo "WebSeal 服务异常，请及时处理！" | mail -s "WebSeal 告警" "$ALERT_EMAIL"
    # 尝试重启服务
    docker-compose restart webseal
fi
EOF

# 添加到定时任务
echo "*/5 * * * * /path/to/health_check.sh" | crontab -
```

## 🔌 API集成

### 基础用法

```javascript
// JavaScript 示例
const websealAPI = {
    baseURL: 'http://localhost:3000/api',
    
    // 网页截图
    async screenshot(data) {
        const response = await fetch(`${this.baseURL}/screenshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    
    // 水印检测
    async detectWatermark(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${this.baseURL}/detect-watermark`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    },
    
    // 获取记录
    async getRecords(params = {}) {
        const url = new URL(`${this.baseURL}/records`);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        
        const response = await fetch(url);
        return await response.json();
    }
};

// 使用示例
(async () => {
    try {
        // 生成截图
        const result = await websealAPI.screenshot({
            url: 'https://example.com',
            watermarkText: 'WebSeal - ' + new Date().toISOString(),
            customText: '法律存证专用'
        });
        console.log('截图成功:', result);
        
        // 获取记录
        const records = await websealAPI.getRecords({
            page: 1,
            limit: 10
        });
        console.log('记录列表:', records);
        
    } catch (error) {
        console.error('API 调用失败:', error);
    }
})();
```

### Python 集成

```python
import requests
import json

class WebSealAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
    
    def screenshot(self, data):
        """生成网页截图"""
        url = f'{self.base_url}/screenshot'
        response = requests.post(url, json=data)
        return response.json()
    
    def detect_watermark(self, image_path):
        """检测水印"""
        url = f'{self.base_url}/detect-watermark'
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(url, files=files)
        return response.json()
    
    def get_records(self, **params):
        """获取记录列表"""
        url = f'{self.base_url}/records'
        response = requests.get(url, params=params)
        return response.json()

# 使用示例
if __name__ == '__main__':
    api = WebSealAPI()
    
    try:
        # 生成截图
        result = api.screenshot({
            'url': 'https://example.com',
            'watermarkText': 'WebSeal - ' + datetime.now().isoformat(),
            'customText': '法律存证专用'
        })
        print('截图成功:', result)
        
        # 检测水印
        detection = api.detect_watermark('path/to/image.png')
        print('检测结果:', detection)
        
    except Exception as e:
        print('API 调用失败:', e)
```

### cURL 示例

```bash
# 生成截图
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "watermarkText": "WebSeal - 2025-01-15T10:30:45.123Z",
    "customText": "法律存证专用"
  }'

# 检测水印
curl -X POST http://localhost:3000/api/detect-watermark \
  -F "image=@/path/to/image.png"

# 获取记录
curl "http://localhost:3000/api/records?page=1&limit=10"
```

## 📞 技术支持

如果您在部署或使用过程中遇到问题，可以通过以下方式获取帮助：

- **GitHub Issues**: https://github.com/webseal/webseal/issues
- **技术文档**: https://docs.webseal.com
- **邮件支持**: support@webseal.com
- **社区论坛**: https://community.webseal.com

---

**WebSeal Team**  
版本 v1.0.0 | 最后更新: 2025年6月15日
