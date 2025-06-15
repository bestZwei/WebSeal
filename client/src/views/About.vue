<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          关于 WebSeal
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          专业的网页快照水印存证系统，为您的数字证据保驾护航
        </p>
      </div>

      <!-- 产品介绍 -->
      <el-card class="mb-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-blue-500"><InfoFilled /></el-icon>
            <span class="font-semibold">产品介绍</span>
          </div>
        </template>

        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">什么是 WebSeal？</h3>
            <p class="text-gray-600 leading-relaxed">
              WebSeal 是一款专业的网页快照水印存证系统，采用先进的隐形水印技术，
              为用户提供可靠的网页存档和法律存证服务。系统结合了高质量网页截图、
              LSB（最低有效位）隐写术和时间戳技术，确保数字证据的完整性、真实性和法律效力。
            </p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">应用场景</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-medium text-blue-900 mb-2">法律存证</h4>
                <p class="text-blue-700 text-sm">知识产权保护、合同纠纷、网络侵权等法律证据保全</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-medium text-green-900 mb-2">内容归档</h4>
                <p class="text-green-700 text-sm">重要网页内容备份、历史版本记录、数据归档管理</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-medium text-purple-900 mb-2">监管合规</h4>
                <p class="text-purple-700 text-sm">金融监管、医疗合规、教育审计等行业合规要求</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg">
                <h4 class="font-medium text-orange-900 mb-2">新闻媒体</h4>
                <p class="text-orange-700 text-sm">新闻报道存证、舆情监控、媒体素材管理</p>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 技术特性 -->
      <el-card class="mb-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-green-500"><Cpu /></el-icon>
            <span class="font-semibold">核心技术</span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">隐形水印技术</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <el-icon class="text-green-500 mr-2 mt-1"><Check /></el-icon>
                <span>基于 LSB（最低有效位）算法实现</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-green-500 mr-2 mt-1"><Check /></el-icon>
                <span>水印完全不可见，不影响图片质量</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-green-500 mr-2 mt-1"><Check /></el-icon>
                <span>支持时间戳和自定义文字水印</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-green-500 mr-2 mt-1"><Check /></el-icon>
                <span>具备防篡改和完整性验证功能</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">网页截图引擎</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <el-icon class="text-blue-500 mr-2 mt-1"><Check /></el-icon>
                <span>基于 Puppeteer 和 Chromium 内核</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-blue-500 mr-2 mt-1"><Check /></el-icon>
                <span>支持全页面高质量截图</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-blue-500 mr-2 mt-1"><Check /></el-icon>
                <span>智能等待页面加载完成</span>
              </li>
              <li class="flex items-start">
                <el-icon class="text-blue-500 mr-2 mt-1"><Check /></el-icon>
                <span>支持复杂页面结构和动态内容</span>
              </li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- 系统架构 -->
      <el-card class="mb-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-purple-500"><Setting /></el-icon>
            <span class="font-semibold">系统架构</span>
          </div>
        </template>

        <div class="text-center">
          <div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-8 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <el-icon size="24" class="text-white"><Monitor /></el-icon>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">前端界面</h4>
                <p class="text-gray-600 text-sm">Vue.js + Element Plus</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <el-icon size="24" class="text-white"><Server /></el-icon>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">后端服务</h4>
                <p class="text-gray-600 text-sm">Node.js + Express</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <el-icon size="24" class="text-white"><DataBoard /></el-icon>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">数据存储</h4>
                <p class="text-gray-600 text-sm">SQLite / PostgreSQL</p>
              </div>
            </div>
          </div>

          <div class="text-left">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">技术栈详情</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">前端技术</h4>
                <ul class="text-gray-600 text-sm space-y-1">
                  <li>• Vue.js 3 + Composition API</li>
                  <li>• Element Plus UI 组件库</li>
                  <li>• Tailwind CSS 样式框架</li>
                  <li>• Vite 构建工具</li>
                  <li>• Axios HTTP 客户端</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 mb-2">后端技术</h4>
                <ul class="text-gray-600 text-sm space-y-1">
                  <li>• Node.js 运行时环境</li>
                  <li>• Express.js Web 框架</li>
                  <li>• Puppeteer 浏览器自动化</li>
                  <li>• Sharp/Jimp 图像处理</li>
                  <li>• SQLite 轻量级数据库</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 部署方案 -->
      <el-card class="mb-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-orange-500"><Box /></el-icon>
            <span class="font-semibold">部署方案</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2 flex items-center">
              <el-icon class="mr-2 text-blue-500"><Platform /></el-icon>
              Docker 容器化部署（推荐）
            </h4>
            <p class="text-gray-600 text-sm mb-2">
              支持 Docker 和 Docker Compose 一键部署，包含完整的运行环境和依赖
            </p>
            <div class="bg-white p-3 rounded border text-sm font-mono">
              docker run -d --name webseal -p 3000:3000 webseal/webseal:latest
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2 flex items-center">
              <el-icon class="mr-2 text-green-500"><Monitor /></el-icon>
              传统服务器部署
            </h4>
            <p class="text-gray-600 text-sm">
              支持在 Linux、macOS、Windows 等操作系统上直接部署
            </p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2 flex items-center">
              <el-icon class="mr-2 text-purple-500"><CloudArrowUp /></el-icon>
              云服务部署
            </h4>
            <p class="text-gray-600 text-sm">
              支持 AWS、阿里云、腾讯云等主流云服务平台部署
            </p>
          </div>
        </div>
      </el-card>

      <!-- 版本信息 -->
      <el-card class="mb-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-indigo-500"><Document /></el-icon>
            <span class="font-semibold">版本信息</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-gray-600">当前版本</span>
            <el-tag type="success">v1.0.0</el-tag>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-gray-600">发布日期</span>
            <span class="text-gray-900">2025年6月15日</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-gray-600">开源协议</span>
            <span class="text-gray-900">MIT License</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">开发团队</span>
            <span class="text-gray-900">WebSeal Team</span>
          </div>
        </div>
      </el-card>

      <!-- 联系我们 -->
      <el-card>
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-red-500"><Message /></el-icon>
            <span class="font-semibold">联系我们</span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-3">技术支持</h4>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <el-icon class="text-gray-400 mr-2"><Message /></el-icon>
                <span class="text-gray-600">邮箱：</span>
                <a href="mailto:support@webseal.com" class="text-blue-600 hover:underline ml-1">
                  support@webseal.com
                </a>
              </div>
              <div class="flex items-center">
                <el-icon class="text-gray-400 mr-2"><Link /></el-icon>
                <span class="text-gray-600">官网：</span>
                <a href="https://webseal.com" target="_blank" class="text-blue-600 hover:underline ml-1">
                  https://webseal.com
                </a>
              </div>
              <div class="flex items-center">
                <el-icon class="text-gray-400 mr-2"><Platform /></el-icon>
                <span class="text-gray-600">GitHub：</span>
                <a href="https://github.com/webseal/webseal" target="_blank" class="text-blue-600 hover:underline ml-1">
                  https://github.com/webseal/webseal
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 mb-3">开源贡献</h4>
            <p class="text-gray-600 text-sm mb-3">
              WebSeal 是一个开源项目，我们欢迎社区的贡献和反馈。
              您可以通过以下方式参与项目：
            </p>
            <div class="space-y-1 text-sm">
              <div class="flex items-center">
                <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                <span class="text-gray-600">提交 Bug 报告和功能建议</span>
              </div>
              <div class="flex items-center">
                <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                <span class="text-gray-600">贡献代码和文档改进</span>
              </div>
              <div class="flex items-center">
                <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                <span class="text-gray-600">参与社区讨论和技术交流</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import {
  InfoFilled,
  Cpu,
  Check,
  Setting,
  Monitor,
  Server,
  DataBoard,
  Box,
  Platform,
  CloudArrowUp,
  Document,
  Message,
  Link
} from '@element-plus/icons-vue'
</script>

<style scoped>
/* 卡片样式优化 */
.el-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

/* 渐变背景 */
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 代码块样式 */
.font-mono {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
