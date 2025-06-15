<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          网页快照存证
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          输入网址，生成高质量网页截图并添加隐形水印，确保证据的完整性和可信度
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：输入表单 -->
        <div class="lg:col-span-1">
          <el-card class="sticky top-8">
            <template #header>
              <div class="flex items-center">
                <el-icon class="mr-2 text-blue-500"><Camera /></el-icon>
                <span class="font-semibold">截图配置</span>
              </div>
            </template>

            <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
              <!-- 网址输入 -->
              <el-form-item label="目标网址" prop="url">
                <el-input
                  v-model="form.url"
                  placeholder="请输入要截图的网址，如：https://example.com"
                  clearable
                  size="large"
                >
                  <template #prefix>
                    <el-icon><Globe /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 水印配置 -->
              <el-form-item label="时间水印">
                <el-input
                  v-model="form.watermarkText"
                  placeholder="默认：WebSeal - 当前时间"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Timer /></el-icon>
                  </template>
                </el-input>
                <div class="text-xs text-gray-500 mt-1">
                  留空将使用默认时间戳格式
                </div>
              </el-form-item>

              <el-form-item label="自定义文字">
                <el-input
                  v-model="form.customText"
                  type="textarea"
                  :rows="3"
                  placeholder="输入自定义水印文字（可选）"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>

              <!-- 高级选项 -->
              <el-collapse v-model="activeCollapse">
                <el-collapse-item title="高级选项" name="advanced">
                  <el-form-item label="截图质量">
                    <el-slider
                      v-model="form.quality"
                      :min="60"
                      :max="100"
                      :step="10"
                      show-stops
                      show-input
                    />
                  </el-form-item>

                  <el-form-item label="视窗宽度">
                    <el-input-number
                      v-model="form.width"
                      :min="800"
                      :max="3840"
                      :step="100"
                      controls-position="right"
                    />
                    <div class="text-xs text-gray-500 mt-1">
                      推荐：1920px（桌面）或 375px（移动）
                    </div>
                  </el-form-item>

                  <el-form-item label="加载延迟">
                    <el-input-number
                      v-model="form.delay"
                      :min="0"
                      :max="10000"
                      :step="500"
                      controls-position="right"
                    />
                    <div class="text-xs text-gray-500 mt-1">
                      等待页面加载的时间（毫秒）
                    </div>
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>

              <!-- 提交按钮 -->
              <el-form-item class="mt-6">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleSubmit"
                  class="w-full gradient-button"
                >
                  <el-icon class="mr-2"><Camera /></el-icon>
                  {{ loading ? '正在处理...' : '开始截图存证' }}
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 处理进度 -->
            <div v-if="loading" class="mt-4">
              <el-progress
                :percentage="progress"
                :status="progressStatus"
                :stroke-width="8"
              />
              <div class="text-center text-sm text-gray-600 mt-2">
                {{ progressText }}
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右侧：结果展示 -->
        <div class="lg:col-span-2">
          <!-- 结果卡片 -->
          <el-card v-if="result" class="mb-6">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <el-icon class="mr-2 text-green-500"><SuccessFilled /></el-icon>
                  <span class="font-semibold">截图完成</span>
                </div>
                <div class="flex items-center space-x-2">
                  <el-button
                    size="small"
                    @click="downloadImage(result.watermarkedImage, 'watermarked')"
                  >
                    <el-icon class="mr-1"><Download /></el-icon>
                    下载水印版
                  </el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="downloadImage(result.originalImage, 'original')"
                  >
                    下载原图
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 基本信息 -->
            <div class="mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">目标网址：</span>
                  <a :href="result.url" target="_blank" class="text-blue-600 hover:underline break-all">
                    {{ result.url }}
                  </a>
                </div>
                <div>
                  <span class="text-gray-500">处理时间：</span>
                  <span>{{ formatTime.format(result.createdAt) }}</span>
                </div>
                <div>
                  <span class="text-gray-500">时间水印：</span>
                  <span>{{ result.watermarkText }}</span>
                </div>
                <div v-if="result.customText">
                  <span class="text-gray-500">自定义文字：</span>
                  <span>{{ result.customText }}</span>
                </div>
              </div>
            </div>

            <!-- 图片对比 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 原图 -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <el-icon class="mr-1"><Picture /></el-icon>
                  原始截图
                </h4>
                <div class="relative group">
                  <img
                    :src="result.originalImage"
                    alt="原始截图"
                    class="w-full rounded-lg shadow-md cursor-pointer image-preview"
                    @click="previewImage(result.originalImage)"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <el-icon size="24" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ZoomIn />
                    </el-icon>
                  </div>
                </div>
              </div>

              <!-- 水印版 -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <el-icon class="mr-1"><Lock /></el-icon>
                  水印版本
                  <el-tag size="small" type="success" class="ml-2">已添加隐形水印</el-tag>
                </h4>
                <div class="relative group">
                  <img
                    :src="result.watermarkedImage"
                    alt="水印截图"
                    class="w-full rounded-lg shadow-md cursor-pointer image-preview"
                    @click="previewImage(result.watermarkedImage)"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <el-icon size="24" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ZoomIn />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-6 flex flex-wrap gap-3">
              <el-button @click="router.push('/detect')" type="success">
                <el-icon class="mr-1"><Search /></el-icon>
                检测水印
              </el-button>
              <el-button @click="router.push('/records')" type="info">
                <el-icon class="mr-1"><Document /></el-icon>
                查看记录
              </el-button>
              <el-button @click="copyUrl" type="text">
                <el-icon class="mr-1"><CopyDocument /></el-icon>
                复制链接
              </el-button>
            </div>
          </el-card>

          <!-- 使用说明 -->
          <el-card v-else>
            <template #header>
              <div class="flex items-center">
                <el-icon class="mr-2 text-blue-500"><InfoFilled /></el-icon>
                <span class="font-semibold">使用说明</span>
              </div>
            </template>

            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span class="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">输入网址</h4>
                  <p class="text-gray-600 text-sm">输入要截图的完整网址，支持HTTP和HTTPS协议</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span class="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">配置水印</h4>
                  <p class="text-gray-600 text-sm">设置时间戳和自定义文字，系统将自动嵌入隐形水印</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span class="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">生成存证</h4>
                  <p class="text-gray-600 text-sm">点击开始按钮，系统将生成高质量截图并添加水印</p>
                </div>
              </div>

              <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-start">
                  <el-icon class="text-yellow-600 mr-2 mt-1"><Warning /></el-icon>
                  <div>
                    <h5 class="text-yellow-800 font-medium">注意事项</h5>
                    <ul class="text-yellow-700 text-sm mt-1 space-y-1">
                      <li>• 确保目标网站可正常访问</li>
                      <li>• 复杂页面可能需要更长的加载时间</li>
                      <li>• 隐形水印不会影响图片的视觉效果</li>
                      <li>• 建议保存原图和水印版本用于对比</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="80%"
      :show-close="true"
      center
    >
      <div class="text-center">
        <img
          :src="previewImageUrl"
          alt="预览图片"
          class="max-w-full max-h-96 rounded-lg shadow-lg"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Camera,
  Globe,
  Timer,
  Lock,
  Picture,
  Search,
  Document,
  Download,
  ZoomIn,
  CopyDocument,
  SuccessFilled,
  InfoFilled,
  Warning
} from '@element-plus/icons-vue'
import { websealAPI } from '@/utils/api'
import { formatTime, isValidUrl, downloadFile, copyToClipboard } from '@/utils/helpers'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const progress = ref(0)
const progressStatus = ref('')
const progressText = ref('')
const result = ref(null)
const previewVisible = ref(false)
const previewImageUrl = ref('')
const activeCollapse = ref([])

// 表单数据
const form = reactive({
  url: '',
  watermarkText: '',
  customText: '',
  quality: 90,
  width: 1920,
  delay: 2000
})

// 表单验证规则
const rules = {
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !isValidUrl(value)) {
          callback(new Error('请输入有效的网址格式'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 模拟进度更新
const updateProgress = () => {
  const steps = [
    { percent: 10, text: '正在访问网页...', status: '' },
    { percent: 30, text: '等待页面加载...', status: '' },
    { percent: 50, text: '正在生成截图...', status: '' },
    { percent: 70, text: '正在添加水印...', status: '' },
    { percent: 90, text: '正在保存结果...', status: '' },
    { percent: 100, text: '处理完成！', status: 'success' }
  ]

  let stepIndex = 0
  const interval = setInterval(() => {
    if (stepIndex < steps.length) {
      const step = steps[stepIndex]
      progress.value = step.percent
      progressText.value = step.text
      progressStatus.value = step.status
      stepIndex++
    } else {
      clearInterval(interval)
    }
  }, 1000)

  return interval
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    loading.value = true
    progress.value = 0
    progressStatus.value = ''
    result.value = null

    // 开始进度模拟
    const progressInterval = updateProgress()

    try {
      const response = await websealAPI.screenshot({
        url: form.url,
        watermarkText: form.watermarkText || undefined,
        customText: form.customText || undefined,
        quality: form.quality,
        width: form.width,
        delay: form.delay
      })

      clearInterval(progressInterval)
      
      result.value = response
      
      ElNotification({
        title: '截图成功',
        message: '网页截图已生成，水印已添加',
        type: 'success',
        duration: 3000
      })

    } catch (error) {
      clearInterval(progressInterval)
      console.error('截图失败:', error)
      
      ElMessage.error('截图失败，请检查网址是否可访问')
    }

  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  previewVisible.value = true
}

// 下载图片
const downloadImage = (imageUrl, type) => {
  const filename = `webseal-${type}-${Date.now()}.png`
  downloadFile(imageUrl, filename)
  
  ElMessage.success('图片下载已开始')
}

// 复制链接
const copyUrl = async () => {
  if (result.value) {
    const success = await copyToClipboard(result.value.watermarkedImage)
    if (success) {
      ElMessage.success('图片链接已复制到剪贴板')
    } else {
      ElMessage.error('复制失败，请手动复制')
    }
  }
}
</script>

<style scoped>
/* 渐变按钮样式 */
.gradient-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  transition: all 0.3s ease;
}

.gradient-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

/* 图片预览效果 */
.image-preview {
  transition: transform 0.3s ease;
}

.image-preview:hover {
  transform: scale(1.02);
}

/* 粘性定位优化 */
@media (max-width: 1024px) {
  .sticky {
    position: static;
    top: auto;
  }
}

/* 响应式表单 */
@media (max-width: 768px) {
  .el-form-item {
    margin-bottom: 18px;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
