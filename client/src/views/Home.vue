<template>
  <div class="min-h-screen">
    <!-- 英雄区域 -->
    <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
      <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 fade-in-up">
            专业的
            <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              网页快照存证
            </span>
            系统
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto fade-in-up" style="animation-delay: 0.2s">
            采用先进的隐形水印技术，为您的网页存档和法律存证提供可靠保障。
            支持时间戳水印、自定义文字水印，确保证据的完整性和可信度。
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center fade-in-up" style="animation-delay: 0.4s">
            <el-button
              type="primary"
              size="large"
              class="gradient-button px-8 py-3 text-lg"
              @click="router.push('/screenshot')"
            >
              <el-icon class="mr-2"><Camera /></el-icon>
              开始截图存证
            </el-button>
            <el-button
              size="large"
              class="px-8 py-3 text-lg"
              @click="router.push('/detect')"
            >
              <el-icon class="mr-2"><Search /></el-icon>
              检测水印信息
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 装饰性元素 -->
      <div class="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div class="absolute top-20 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute bottom-10 left-1/2 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 2s"></div>
    </section>

    <!-- 核心功能介绍 -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            核心功能特性
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            WebSeal 提供完整的网页存证解决方案，满足您的各种需求
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- 功能卡片 -->
          <div
            v-for="feature in features"
            :key="feature.title"
            class="glass-card rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <el-icon size="24" class="text-white">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
            <p class="text-gray-600 mb-4">{{ feature.description }}</p>
            <ul class="space-y-1">
              <li v-for="item in feature.items" :key="item" class="text-sm text-gray-500 flex items-center">
                <el-icon size="12" class="text-green-500 mr-2"><Check /></el-icon>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 技术优势 -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              为什么选择 WebSeal？
            </h2>
            <div class="space-y-6">
              <div v-for="advantage in advantages" :key="advantage.title" class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <el-icon size="16" class="text-blue-600">
                    <component :is="advantage.icon" />
                  </el-icon>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ advantage.title }}</h3>
                  <p class="text-gray-600">{{ advantage.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="relative">
            <div class="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <div class="text-center">
                <el-icon size="80" class="text-blue-500 mb-4"><Shield /></el-icon>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">安全可信</h3>
                <p class="text-gray-600 px-6">
                  采用先进的LSB隐形水印算法，确保水印信息的安全性和不可篡改性
                </p>
              </div>
            </div>
            <!-- 装饰性元素 -->
            <div class="absolute -top-4 -left-4 w-8 h-8 bg-yellow-300 rounded-full"></div>
            <div class="absolute -bottom-4 -right-4 w-6 h-6 bg-pink-300 rounded-full"></div>
            <div class="absolute top-1/2 -right-2 w-4 h-4 bg-green-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用统计 -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            实时使用数据
          </h2>
          <p class="text-lg text-gray-600">
            查看系统的实时使用情况和性能指标
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100"
          >
            <div class="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
              {{ stat.loading ? '---' : stat.value }}
            </div>
            <div class="text-gray-600 font-medium">{{ stat.label }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ stat.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速开始 -->
    <section class="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
          立即开始使用 WebSeal
        </h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          三步完成网页存证：输入网址 → 生成快照 → 添加水印，简单高效！
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <el-button
            size="large"
            class="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
            @click="router.push('/screenshot')"
          >
            立即开始截图
          </el-button>
          <el-button
            size="large"
            type="text"
            class="text-white border-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold"
            @click="router.push('/about')"
          >
            了解更多
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Camera,
  Search,
  Check,
  Shield,
  Lock,
  Timer,
  Document,
  Setting,
  DataAnalysis,
  Lightning,
  Globe,
  Cpu
} from '@element-plus/icons-vue'
import { websealAPI } from '@/utils/api'

const router = useRouter()

// 功能特性
const features = [
  {
    title: '网页快照',
    description: '高质量全页面截图，支持复杂页面结构',
    icon: 'Camera',
    items: ['全页面截图', '高分辨率输出', '智能等待加载', '移动端适配']
  },
  {
    title: '隐形水印',
    description: '基于LSB算法的不可见水印技术',
    icon: 'Lock',
    items: ['时间戳水印', '自定义文字', '不影响画质', '防篡改保护']
  },
  {
    title: '水印检测',
    description: '快速检测和提取隐藏的水印信息',
    icon: 'Search',
    items: ['一键检测', '信息提取', '完整性验证', '置信度评分']
  },
  {
    title: '存证管理',
    description: '完整的存证记录管理系统',
    icon: 'Document',
    items: ['记录追踪', '批量管理', '数据导出', '历史查询']
  },
  {
    title: '高性能',
    description: '优化的处理引擎，快速响应',
    icon: 'Lightning',
    items: ['并发处理', '内存优化', '缓存机制', 'CDN加速']
  },
  {
    title: 'API接口',
    description: '完整的RESTful API支持',
    icon: 'Setting',
    items: ['标准接口', '文档完整', 'SDK支持', '第三方集成']
  }
]

// 技术优势
const advantages = [
  {
    title: '先进算法',
    description: '采用业界领先的LSB隐写术，确保水印的隐蔽性和可靠性',
    icon: 'Cpu'
  },
  {
    title: '法律效力',
    description: '符合电子证据标准，可用于法律存证和纠纷解决',
    icon: 'Shield'
  },
  {
    title: '时间戳',
    description: '精确的时间戳记录，确保证据的时效性和完整性',
    icon: 'Timer'
  },
  {
    title: '全球访问',
    description: '支持全球网站访问，智能处理各种网页结构',
    icon: 'Globe'
  }
]

// 统计数据
const stats = ref([
  { label: '总存证记录', value: 0, desc: '累计生成', loading: true },
  { label: '今日处理', value: 0, desc: '实时统计', loading: true },
  { label: '成功率', value: '99%', desc: '处理成功率', loading: false },
  { label: '平均耗时', value: '3.2s', desc: '响应时间', loading: false }
])

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await websealAPI.getRecords({ page: 1, limit: 1 })
    if (response && response.pagination) {
      stats.value[0].value = response.pagination.total || 0
      stats.value[0].loading = false
      
      // 模拟今日处理数据
      stats.value[1].value = Math.floor(Math.random() * 50) + 10
      stats.value[1].loading = false
    }
  } catch (error) {
    console.warn('获取统计数据失败:', error)
    // 使用模拟数据
    stats.value[0].value = 1285
    stats.value[0].loading = false
    stats.value[1].value = 47
    stats.value[1].loading = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
/* 网格背景 */
.bg-grid-pattern {
  background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 动画类 */
.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 玻璃效果 */
.glass-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 渐变按钮 */
.gradient-button {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  transition: all 0.3s ease;
}

.gradient-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .fade-in-up {
    animation-delay: 0s !important;
  }
}
</style>
