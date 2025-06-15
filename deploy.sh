#!/bin/bash

# WebSeal 部署脚本
# 用法: ./deploy.sh [environment] [version]
# 示例: ./deploy.sh production v1.0.0

set -e

# 默认参数
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
PROJECT_NAME="webseal"
DOCKER_IMAGE="webseal/webseal:${VERSION}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p data
    mkdir -p uploads
    mkdir -p logs
    mkdir -p ssl
    
    log_success "目录创建完成"
}

# 生成配置文件
generate_config() {
    log_info "生成配置文件..."
    
    # 生成环境变量文件
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_warning "请编辑 .env 文件配置环境变量"
    fi
    
    # 生成 docker-compose override 文件
    if [ "$ENVIRONMENT" == "production" ] && [ ! -f "docker-compose.override.yml" ]; then
        cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  webseal:
    image: ${DOCKER_IMAGE}
    restart: always
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
EOF
        log_success "生成 docker-compose.override.yml"
    fi
    
    log_success "配置文件生成完成"
}

# 设置防火墙规则
setup_firewall() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "设置防火墙规则..."
        
        if command -v ufw &> /dev/null; then
            sudo ufw allow 3000/tcp
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            log_success "防火墙规则设置完成"
        else
            log_warning "未检测到 ufw，请手动设置防火墙规则"
        fi
    fi
}

# 设置 SSL 证书
setup_ssl() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "设置 SSL 证书..."
        
        if [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
            log_warning "SSL 证书未找到，生成自签名证书..."
            
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/server.key \
                -out ssl/server.crt \
                -subj "/C=CN/ST=State/L=City/O=Organization/CN=webseal.local"
            
            log_success "自签名证书生成完成"
            log_warning "生产环境请使用正式的SSL证书"
        fi
    fi
}

# 数据库备份
backup_database() {
    if [ -f "data/webseal.db" ]; then
        log_info "备份数据库..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp data/webseal.db "$BACKUP_DIR/webseal.db"
        
        log_success "数据库备份完成: $BACKUP_DIR"
    fi
}

# 拉取最新镜像
pull_image() {
    log_info "拉取最新镜像..."
    
    docker pull "$DOCKER_IMAGE"
    
    log_success "镜像拉取完成"
}

# 停止旧容器
stop_containers() {
    log_info "停止旧容器..."
    
    docker-compose down
    
    log_success "容器停止完成"
}

# 启动新容器
start_containers() {
    log_info "启动新容器..."
    
    docker-compose up -d
    
    log_success "容器启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 10
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "容器启动失败"
        docker-compose logs
        exit 1
    fi
    
    # 检查服务健康状态
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "服务健康检查通过"
            return 0
        fi
        log_info "等待服务启动... ($i/30)"
        sleep 2
    done
    
    log_error "服务健康检查失败"
    exit 1
}

# 清理旧镜像
cleanup() {
    log_info "清理旧镜像..."
    
    docker image prune -f
    
    log_success "清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo
    echo "==================== 部署信息 ===================="
    echo "环境: $ENVIRONMENT"
    echo "版本: $VERSION"
    echo "访问地址: http://localhost:3000"
    echo "Docker 镜像: $DOCKER_IMAGE"
    echo "数据目录: $(pwd)/data"
    echo "上传目录: $(pwd)/uploads"
    echo "日志目录: $(pwd)/logs"
    echo "================================================="
    echo
    echo "常用命令:"
    echo "查看日志: docker-compose logs -f"
    echo "重启服务: docker-compose restart"
    echo "停止服务: docker-compose down"
    echo "更新服务: docker-compose pull && docker-compose up -d"
}

# 主函数
main() {
    log_info "开始部署 WebSeal $VERSION 到 $ENVIRONMENT 环境..."
    
    check_dependencies
    create_directories
    generate_config
    setup_firewall
    setup_ssl
    backup_database
    pull_image
    stop_containers
    start_containers
    health_check
    cleanup
    show_deployment_info
}

# 错误处理
trap 'log_error "部署失败！请检查错误信息"; exit 1' ERR

# 执行主函数
main "$@"
