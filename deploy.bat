@echo off
setlocal EnableDelayedExpansion

REM WebSeal 项目部署脚本 (Windows)
REM 使用方法: deploy.bat [platform]
REM 支持的平台: docker, local

if "%1"=="" (
    call :show_help
    exit /b 1
)

echo ============================================
echo 🚀 WebSeal 项目部署工具
echo 专业的网页存证工具 - 盲水印技术
echo ============================================
echo.

if "%1"=="docker" (
    call :deploy_docker
) else if "%1"=="local" (
    call :deploy_local
) else if "%1"=="help" (
    call :show_help
) else (
    echo [ERROR] 未知的部署平台: %1
    call :show_help
    exit /b 1
)

goto :eof

:check_dependencies
echo [INFO] 检查项目依赖...

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装，请先安装 Node.js 18+ 版本
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm 未安装，请先安装 npm
    exit /b 1
)

echo [SUCCESS] 依赖检查通过
goto :eof

:install_dependencies
echo [INFO] 安装项目依赖...
npm install
if errorlevel 1 (
    echo [ERROR] 依赖安装失败
    exit /b 1
)
echo [SUCCESS] 依赖安装完成
goto :eof

:build_project
echo [INFO] 构建项目...
npm run build
if errorlevel 1 (
    echo [ERROR] 项目构建失败
    exit /b 1
)
echo [SUCCESS] 项目构建完成
goto :eof

:run_tests
echo [INFO] 运行类型检查...
npm run type-check
if errorlevel 1 (
    echo [ERROR] 类型检查失败
    exit /b 1
)
echo [SUCCESS] 类型检查通过
goto :eof

:deploy_docker
call :check_dependencies
call :install_dependencies
call :build_project
call :run_tests

echo [INFO] 准备 Docker 部署...

docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装，请先安装 Docker
    exit /b 1
)

echo [INFO] 构建 Docker 镜像...
docker build -t webseal:latest .
if errorlevel 1 (
    echo [ERROR] Docker 镜像构建失败
    exit /b 1
)

echo [INFO] 启动 Docker 容器...
docker run -d -p 3000:3000 --name webseal-container webseal:latest
if errorlevel 1 (
    echo [ERROR] Docker 容器启动失败
    exit /b 1
)

echo [SUCCESS] Docker 部署完成！应用运行在 http://localhost:3000
goto :eof

:deploy_local
call :check_dependencies
call :install_dependencies

echo [INFO] 启动本地开发服务器...
npm run dev
goto :eof

:show_help
echo WebSeal 部署脚本使用说明
echo.
echo 使用方法:
echo   %0 [platform]
echo.
echo 支持的平台:
echo   docker  - 使用 Docker 部署
echo   local   - 本地开发模式
echo   help    - 显示此帮助信息
echo.
echo 示例:
echo   %0 docker   # Docker 部署
echo   %0 local    # 本地开发
goto :eof
