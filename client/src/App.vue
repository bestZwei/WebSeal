<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <router-link to="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">WS</span>
              </div>
              <span class="text-xl font-bold text-gray-900">WebSeal</span>
            </router-link>
          </div>
          
          <!-- 导航菜单 -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              active-class="text-blue-600 bg-blue-50"
            >
              <el-icon class="mr-1">
                <component :is="item.icon" />
              </el-icon>
              {{ item.name }}
            </router-link>
          </div>
          
          <!-- 移动端菜单按钮 -->
          <div class="md:hidden flex items-center">
            <el-button
              type="text"
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="text-gray-600"
            >
              <el-icon size="20">
                <Menu />
              </el-icon>
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 移动端菜单 -->
      <div v-show="mobileMenuOpen" class="md:hidden bg-white border-t">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="mobileMenuOpen = false"
            class="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            active-class="text-blue-600 bg-blue-50"
          >
            <el-icon class="mr-2">
              <component :is="item.icon" />
            </el-icon>
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="min-h-screen">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-900 text-white">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- 产品信息 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">WS</span>
              </div>
              <span class="text-xl font-bold">WebSeal</span>
            </div>
            <p class="text-gray-300 mb-4 max-w-md">
              专业的网页快照水印存证系统，采用先进的隐形水印技术，为您的网页存档和法律存证提供可靠保障。
            </p>
            <div class="flex space-x-4">
              <el-button type="text" class="text-gray-300 hover:text-white">
                <el-icon class="mr-1"><DocumentCopy /></el-icon>
                技术文档
              </el-button>
              <el-button type="text" class="text-gray-300 hover:text-white">
                <el-icon class="mr-1"><ChatDotRound /></el-icon>
                联系支持
              </el-button>
            </div>
          </div>
          
          <!-- 快速链接 -->
          <div>
            <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              快速导航
            </h3>
            <ul class="space-y-2">
              <li v-for="item in navItems" :key="item.path">
                <router-link
                  :to="item.path"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  {{ item.name }}
                </router-link>
              </li>
            </ul>
          </div>
          
          <!-- 技术特性 -->
          <div>
            <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              核心特性
            </h3>
            <ul class="space-y-2 text-gray-300">
              <li>• 高质量网页截图</li>
              <li>• 隐形水印技术</li>
              <li>• 时间戳存证</li>
              <li>• 水印检测验证</li>
              <li>• 批量处理支持</li>
              <li>• API接口集成</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">
            © {{ currentYear }} WebSeal. 保留所有权利。
          </p>
          <p class="text-gray-400 text-sm mt-2 md:mt-0">
            版本 v1.0.0 | 基于 Vue.js 和 Node.js 构建
          </p>
        </div>
      </div>
    </footer>

    <!-- 全局加载状态 -->
    <el-backtop :right="40" :bottom="40" />
    
    <!-- 通知容器 -->
    <div id="notification-container"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Menu,
  House,
  Camera,
  Search,
  Document,
  InfoFilled,
  DocumentCopy,
  ChatDotRound
} from '@element-plus/icons-vue'

const router = useRouter()
const mobileMenuOpen = ref(false)

// 导航菜单项
const navItems = [
  { path: '/', name: '首页', icon: 'House' },
  { path: '/screenshot', name: '网页截图', icon: 'Camera' },
  { path: '/detect', name: '水印检测', icon: 'Search' },
  { path: '/records', name: '存证记录', icon: 'Document' },
  { path: '/about', name: '关于', icon: 'InfoFilled' }
]

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

// 监听路由变化，关闭移动端菜单
router.afterEach(() => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
/* 导航链接活跃状态样式 */
.router-link-active {
  @apply text-blue-600 bg-blue-50;
}

/* 渐变背景动画 */
.gradient-bg {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-menu-item {
    @apply block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200;
  }
}
</style>
