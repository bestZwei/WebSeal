#!/bin/bash

# WebSeal 项目部署脚本
# 使用方法: ./deploy.sh [platform]
# 支持的平台: vercel, docker, local

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色输出
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_status "检查项目依赖..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js 18+ 版本"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查 Node.js 版本
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 版本过低，需要 18+ 版本，当前版本: $(node -v)"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 安装项目依赖
install_dependencies() {
    print_status "安装项目依赖..."
    npm install
    print_success "依赖安装完成"
}

# 构建项目
build_project() {
    print_status "构建项目..."
    npm run build
    print_success "项目构建完成"
}

# 运行测试
run_tests() {
    print_status "运行类型检查..."
    npm run type-check
    print_success "类型检查通过"
}

# Vercel 部署
deploy_vercel() {
    print_status "准备 Vercel 部署..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI 未安装，正在安装..."
        npm install -g vercel
        if [ $? -ne 0 ]; then
            print_error "Vercel CLI 安装失败"
            exit 1
        fi
    fi
    
    print_status "检查 vercel.json 配置..."
    if [ ! -f "vercel.json" ]; then
        print_error "vercel.json 配置文件不存在"
        exit 1
    fi
    
    # 验证 JSON 格式
    if ! python -m json.tool vercel.json > /dev/null 2>&1; then
        if ! node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" > /dev/null 2>&1; then
            print_error "vercel.json 格式无效"
            exit 1
        fi
    fi
    
    print_status "开始部署到 Vercel..."
    print_warning "注意：首次部署需要登录并配置项目"
    
    vercel --prod
    if [ $? -ne 0 ]; then
        print_error "Vercel 部署失败"
        print_status "请检查："
        echo "  1. 是否已登录 Vercel CLI (vercel login)"
        echo "  2. 项目配置是否正确"
        echo "  3. vercel.json 格式是否有效"
        exit 1
    fi
    
    print_success "Vercel 部署完成！"
    print_status "检查部署状态：vercel ls"
    print_status "查看项目日志：vercel logs"
}

# Docker 部署
deploy_docker() {
    print_status "准备 Docker 部署..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    print_status "构建 Docker 镜像..."
    docker build -t webseal:latest .
    
    print_status "启动 Docker 容器..."
    docker run -d -p 3000:3000 --name webseal-container webseal:latest
    
    print_success "Docker 部署完成！应用运行在 http://localhost:3000"
}

# 本地部署
deploy_local() {
    print_status "启动本地开发服务器..."
    npm run dev
}

# 显示帮助信息
show_help() {
    echo "WebSeal 部署脚本使用说明"
    echo ""
    echo "使用方法:"
    echo "  $0 [platform]"
    echo ""
    echo "支持的平台:"
    echo "  vercel  - 部署到 Vercel 平台"
    echo "  docker  - 使用 Docker 部署"
    echo "  local   - 本地开发模式"
    echo "  help    - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 vercel   # 部署到 Vercel"
    echo "  $0 docker   # Docker 部署"
    echo "  $0 local    # 本地开发"
}

# 主函数
main() {
    clear
    echo "============================================"
    echo "🚀 WebSeal 项目部署工具"
    echo "专业的网页存证工具 - 盲水印技术"
    echo "============================================"
    echo ""
    
    # 检查参数
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    case $1 in
        "vercel")
            check_dependencies
            install_dependencies
            build_project
            run_tests
            deploy_vercel
            ;;
        "docker")
            check_dependencies
            install_dependencies
            build_project
            run_tests
            deploy_docker
            ;;
        "local")
            check_dependencies
            install_dependencies
            deploy_local
            ;;
        "help")
            show_help
            ;;
        *)
            print_error "未知的部署平台: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
