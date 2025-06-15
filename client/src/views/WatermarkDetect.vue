<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          水印检测
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          上传图片文件，系统将自动检测并提取隐藏的水印信息
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：上传区域 -->
        <div>
          <el-card>
            <template #header>
              <div class="flex items-center">
                <el-icon class="mr-2 text-blue-500"><Upload /></el-icon>
                <span class="font-semibold">图片上传</span>
              </div>
            </template>

            <!-- 文件上传 -->
            <el-upload
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              :limit="1"
              accept="image/*"
              :file-list="fileList"
            >
              <div class="upload-content">
                <el-icon class="upload-icon" size="50">
                  <Upload />
                </el-icon>
                <div class="upload-text">
                  将图片拖拽到此处，或<em>点击上传</em>
                </div>
                <div class="upload-tip">
                  支持 JPG、PNG、WEBP 格式，文件大小不超过 10MB
                </div>
              </div>
            </el-upload>

            <!-- 图片预览 -->
            <div v-if="uploadedImage" class="mt-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">图片预览</h4>
              <div class="relative">
                <img
                  :src="uploadedImage"
                  alt="上传的图片"
                  class="w-full max-h-64 object-contain rounded-lg shadow-md"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  class="absolute top-2 right-2"
                  @click="clearImage"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 检测按钮 -->
            <div class="mt-6">
              <el-button
                type="primary"
                size="large"
                :loading="detecting"
                :disabled="!uploadedFile"
                @click="detectWatermark"
                class="w-full gradient-button"
              >
                <el-icon class="mr-2"><Search /></el-icon>
                {{ detecting ? '正在检测...' : '开始检测水印' }}
              </el-button>
            </div>

            <!-- 检测进度 -->
            <div v-if="detecting" class="mt-4">
              <el-progress
                :percentage="detectProgress"
                :status="detectStatus"
                :stroke-width="8"
              />
              <div class="text-center text-sm text-gray-600 mt-2">
                {{ detectText }}
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右侧：检测结果 -->
        <div>
          <el-card>
            <template #header>
              <div class="flex items-center">
                <el-icon 
                  class="mr-2" 
                  :class="detectResult ? 'text-green-500' : 'text-gray-400'"
                >
                  <DataAnalysis />
                </el-icon>
                <span class="font-semibold">检测结果</span>
              </div>
            </template>

            <div v-if="detectResult" class="space-y-6">
              <!-- 检测状态 -->
              <div class="text-center">
                <div class="mb-4">
                  <el-icon 
                    size="48" 
                    :class="detectResult.watermarkDetected ? 'text-green-500' : 'text-red-500'"
                  >
                    <SuccessFilled v-if="detectResult.watermarkDetected" />
                    <WarningFilled v-else />
                  </el-icon>
                </div>
                <h3 class="text-xl font-semibold mb-2">
                  {{ detectResult.watermarkDetected ? '检测到水印' : '未检测到水印' }}
                </h3>
                <p class="text-gray-600">
                  {{ detectResult.watermarkDetected ? '图片包含WebSeal水印信息' : '图片不包含有效的水印信息' }}
                </p>
              </div>

              <!-- 水印信息 -->
              <div v-if="detectResult.watermarkDetected" class="space-y-4">
                <el-divider>水印信息</el-divider>
                
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="space-y-3">
                    <div v-if="detectResult.watermarkText">
                      <div class="flex items-center mb-2">
                        <el-icon class="mr-2 text-green-600"><Timer /></el-icon>
                        <span class="font-medium text-green-800">时间戳水印</span>
                      </div>
                      <p class="text-green-700 bg-green-100 px-3 py-2 rounded">
                        {{ detectResult.watermarkText }}
                      </p>
                    </div>

                    <div v-if="detectResult.customText">
                      <div class="flex items-center mb-2">
                        <el-icon class="mr-2 text-green-600"><Document /></el-icon>
                        <span class="font-medium text-green-800">自定义文字</span>
                      </div>
                      <p class="text-green-700 bg-green-100 px-3 py-2 rounded">
                        {{ detectResult.customText }}
                      </p>
                    </div>

                    <div>
                      <div class="flex items-center mb-2">
                        <el-icon class="mr-2 text-green-600"><DataAnalysis /></el-icon>
                        <span class="font-medium text-green-800">置信度</span>
                      </div>
                      <div class="flex items-center">
                        <el-progress
                          :percentage="Math.round(detectResult.confidence * 100)"
                          :stroke-width="6"
                          :show-text="false"
                          class="flex-1 mr-3"
                        />
                        <span class="text-green-700 font-medium">
                          {{ Math.round(detectResult.confidence * 100) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 验证信息 -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start">
                    <el-icon class="mr-2 text-blue-600 mt-1"><Shield /></el-icon>
                    <div>
                      <h4 class="font-medium text-blue-800 mb-1">验证信息</h4>
                      <ul class="text-blue-700 text-sm space-y-1">
                        <li>✓ 水印签名验证通过</li>
                        <li>✓ 水印完整性验证通过</li>
                        <li>✓ 时间戳格式正确</li>
                        <li v-if="detectResult.customText">✓ 自定义文字完整</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex flex-wrap gap-3">
                  <el-button @click="downloadReport" type="success">
                    <el-icon class="mr-1"><Download /></el-icon>
                    下载检测报告
                  </el-button>
                  <el-button @click="copyWatermarkInfo" type="text">
                    <el-icon class="mr-1"><CopyDocument /></el-icon>
                    复制水印信息
                  </el-button>
                </div>
              </div>

              <!-- 未检测到水印的说明 -->
              <div v-else class="text-center py-8">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <el-icon size="32" class="text-yellow-600 mb-3"><Warning /></el-icon>
                  <h4 class="font-medium text-yellow-800 mb-2">可能的原因</h4>
                  <ul class="text-yellow-700 text-sm space-y-1 text-left">
                    <li>• 图片不是通过WebSeal生成的</li>
                    <li>• 图片已被处理或压缩，水印信息丢失</li>
                    <li>• 图片格式不受支持</li>
                    <li>• 图片质量过低影响检测准确性</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 默认状态 -->
            <div v-else class="text-center py-12">
              <el-icon size="64" class="text-gray-300 mb-4"><Search /></el-icon>
              <h3 class="text-lg font-medium text-gray-900 mb-2">等待检测</h3>
              <p class="text-gray-500">请先上传图片文件</p>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 使用说明 -->
      <el-card class="mt-8">
        <template #header>
          <div class="flex items-center">
            <el-icon class="mr-2 text-blue-500"><InfoFilled /></el-icon>
            <span class="font-semibold">检测说明</span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-3">支持的图片格式</h4>
            <ul class="text-gray-600 text-sm space-y-1">
              <li>• JPEG / JPG 格式</li>
              <li>• PNG 格式（推荐）</li>
              <li>• WEBP 格式</li>
              <li>• 文件大小：10MB以内</li>
            </ul>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 mb-3">检测原理</h4>
            <ul class="text-gray-600 text-sm space-y-1">
              <li>• 基于LSB（最低有效位）算法</li>
              <li>• 提取图像像素的隐藏信息</li>
              <li>• 验证水印签名和完整性</li>
              <li>• 计算检测置信度</li>
            </ul>
          </div>
        </div>

        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start">
            <el-icon class="text-blue-600 mr-2 mt-1"><InfoFilled /></el-icon>
            <div>
              <h5 class="text-blue-800 font-medium mb-1">检测提示</h5>
              <p class="text-blue-700 text-sm">
                为了获得最佳检测效果，建议使用原始质量的图片文件。
                经过压缩、裁剪或其他处理的图片可能会影响水印检测的准确性。
              </p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Upload,
  Search,
  Close,
  DataAnalysis,
  SuccessFilled,
  WarningFilled,
  Timer,
  Document,
  Shield,
  Download,
  CopyDocument,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import { websealAPI } from '@/utils/api'
import { copyToClipboard } from '@/utils/helpers'

const detecting = ref(false)
const detectProgress = ref(0)
const detectStatus = ref('')
const detectText = ref('')
const detectResult = ref(null)
const uploadedFile = ref(null)
const uploadedImage = ref('')
const fileList = ref([])

// 文件上传前的验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size < 10 * 1024 * 1024

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return false // 阻止自动上传
}

// 文件选择处理
const handleFileChange = (file) => {
  uploadedFile.value = file.raw
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
  
  // 重置检测结果
  detectResult.value = null
}

// 清除图片
const clearImage = () => {
  uploadedFile.value = null
  uploadedImage.value = ''
  fileList.value = []
  detectResult.value = null
}

// 模拟检测进度
const updateDetectProgress = () => {
  const steps = [
    { percent: 20, text: '正在读取图片...', status: '' },
    { percent: 40, text: '正在分析像素...', status: '' },
    { percent: 60, text: '正在提取水印...', status: '' },
    { percent: 80, text: '正在验证签名...', status: '' },
    { percent: 100, text: '检测完成！', status: 'success' }
  ]

  let stepIndex = 0
  const interval = setInterval(() => {
    if (stepIndex < steps.length) {
      const step = steps[stepIndex]
      detectProgress.value = step.percent
      detectText.value = step.text
      detectStatus.value = step.status
      stepIndex++
    } else {
      clearInterval(interval)
    }
  }, 800)

  return interval
}

// 检测水印
const detectWatermark = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传图片文件')
    return
  }

  detecting.value = true
  detectProgress.value = 0
  detectStatus.value = ''
  detectResult.value = null

  // 开始进度模拟
  const progressInterval = updateDetectProgress()

  try {
    const formData = new FormData()
    formData.append('image', uploadedFile.value)

    const response = await websealAPI.detectWatermark(formData)
    
    clearInterval(progressInterval)
    detectResult.value = response

    if (response.watermarkDetected) {
      ElNotification({
        title: '检测成功',
        message: '已成功检测到水印信息',
        type: 'success',
        duration: 3000
      })
    } else {
      ElNotification({
        title: '检测完成',
        message: '未检测到有效的水印信息',
        type: 'info',
        duration: 3000
      })
    }

  } catch (error) {
    clearInterval(progressInterval)
    console.error('水印检测失败:', error)
    ElMessage.error('检测失败，请重试')
  } finally {
    detecting.value = false
  }
}

// 下载检测报告
const downloadReport = () => {
  if (!detectResult.value) return

  const report = {
    检测时间: new Date().toLocaleString(),
    检测结果: detectResult.value.watermarkDetected ? '发现水印' : '未发现水印',
    时间戳水印: detectResult.value.watermarkText || '无',
    自定义文字: detectResult.value.customText || '无',
    置信度: Math.round(detectResult.value.confidence * 100) + '%'
  }

  const content = Object.entries(report)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `webseal-detection-report-${Date.now()}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('检测报告下载成功')
}

// 复制水印信息
const copyWatermarkInfo = async () => {
  if (!detectResult.value) return

  const info = [
    detectResult.value.watermarkText && `时间戳水印: ${detectResult.value.watermarkText}`,
    detectResult.value.customText && `自定义文字: ${detectResult.value.customText}`,
    `置信度: ${Math.round(detectResult.value.confidence * 100)}%`
  ].filter(Boolean).join('\n')

  const success = await copyToClipboard(info)
  if (success) {
    ElMessage.success('水印信息已复制到剪贴板')
  } else {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
/* 上传区域样式 */
.upload-demo {
  width: 100%;
}

.upload-content {
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
}

/* 渐变按钮 */
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

/* 上传拖拽区域 */
:deep(.el-upload-dragger) {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #fafafa;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: #f0f9ff;
}

:deep(.el-upload-dragger.is-dragover) {
  border-color: #409eff;
  background: #e0f2fe;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
