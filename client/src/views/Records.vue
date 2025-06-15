<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">存证记录</h1>
          <p class="text-gray-600 mt-2">管理和查看所有的网页截图存证记录</p>
        </div>
        <div class="flex space-x-3">
          <el-button @click="refreshRecords" :loading="loading">
            <el-icon class="mr-1"><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="primary" @click="router.push('/screenshot')">
            <el-icon class="mr-1"><Plus /></el-icon>
            新建存证
          </el-button>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <el-card class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <el-input
            v-model="searchQuery"
            placeholder="搜索网址或水印文字"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="处理中" value="processing" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleFilter"
          />

          <el-select v-model="sortBy" placeholder="排序方式" @change="handleSort">
            <el-option label="最新创建" value="createdAt_desc" />
            <el-option label="最早创建" value="createdAt_asc" />
            <el-option label="网址 A-Z" value="url_asc" />
            <el-option label="网址 Z-A" value="url_desc" />
          </el-select>
        </div>
      </el-card>

      <!-- 批量操作 -->
      <div v-if="selectedRecords.length > 0" class="mb-6">
        <el-alert
          :title="`已选择 ${selectedRecords.length} 条记录`"
          type="info"
          :closable="false"
        >
          <template #default>
            <div class="flex items-center space-x-3 mt-2">
              <el-button size="small" @click="batchDownload" :loading="batchLoading">
                <el-icon class="mr-1"><Download /></el-icon>
                批量下载
              </el-button>
              <el-button size="small" type="danger" @click="confirmBatchDelete">
                <el-icon class="mr-1"><Delete /></el-icon>
                批量删除
              </el-button>
              <el-button size="small" type="text" @click="clearSelection">
                取消选择
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 记录列表 -->
      <el-card>
        <el-table
          :data="recordsData"
          :loading="loading"
          @selection-change="handleSelectionChange"
          empty-text="暂无记录"
          class="w-full"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="网址" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center">
                <img :src="row.watermarkedImage" alt="缩略图" class="w-12 h-8 object-cover rounded mr-3">
                <div>
                  <a :href="row.url" target="_blank" class="text-blue-600 hover:underline text-sm">
                    {{ truncateUrl(row.url) }}
                  </a>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ formatTime.fromNow(row.createdAt) }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="水印信息" min-width="150">
            <template #default="{ row }">
              <div class="text-sm">
                <div class="font-medium text-gray-900">{{ row.watermarkText }}</div>
                <div v-if="row.customText" class="text-gray-600 mt-1">{{ row.customText }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <div class="text-sm text-gray-600">
                {{ formatTime.format(row.createdAt) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex space-x-2">
                <el-button size="small" @click="previewRecord(row)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button size="small" @click="downloadRecord(row)">
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button size="small" type="success" @click="detectWatermark(row)">
                  <el-icon><Search /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="confirmDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-600">
            共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ pagination.totalPages }} 页
          </div>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewRecord?.url"
      width="80%"
      center
    >
      <div v-if="previewRecord" class="space-y-6">
        <!-- 基本信息 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">网址：</span>
            <a :href="previewRecord.url" target="_blank" class="text-blue-600 hover:underline">
              {{ previewRecord.url }}
            </a>
          </div>
          <div>
            <span class="text-gray-500">创建时间：</span>
            <span>{{ formatTime.format(previewRecord.createdAt) }}</span>
          </div>
          <div>
            <span class="text-gray-500">时间水印：</span>
            <span>{{ previewRecord.watermarkText }}</span>
          </div>
          <div v-if="previewRecord.customText">
            <span class="text-gray-500">自定义文字：</span>
            <span>{{ previewRecord.customText }}</span>
          </div>
        </div>

        <!-- 图片对比 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">原始截图</h4>
            <img
              :src="previewRecord.originalImage"
              alt="原始截图"
              class="w-full rounded-lg shadow-md"
            />
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">水印版本</h4>
            <img
              :src="previewRecord.watermarkedImage"
              alt="水印截图"
              class="w-full rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteVisible"
      title="确认删除"
      width="400px"
      center
    >
      <p>确定要删除这条记录吗？此操作不可恢复。</p>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDelete" :loading="deleteLoading">
          删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Delete,
  View
} from '@element-plus/icons-vue'
import { websealAPI } from '@/utils/api'
import { formatTime, downloadFile, debounce } from '@/utils/helpers'

const router = useRouter()
const loading = ref(false)
const batchLoading = ref(false)
const deleteLoading = ref(false)
const recordsData = ref([])
const selectedRecords = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const sortBy = ref('createdAt_desc')
const previewVisible = ref(false)
const previewRecord = ref(null)
const deleteVisible = ref(false)
const deleteRecord = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery.value,
      status: statusFilter.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      sort: sortBy.value
    }

    const response = await websealAPI.getRecords(params)
    recordsData.value = response.records || []
    pagination.total = response.pagination?.total || 0
    pagination.totalPages = response.pagination?.totalPages || 0
  } catch (error) {
    console.error('获取记录失败:', error)
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

// 刷新记录
const refreshRecords = () => {
  fetchRecords()
}

// 搜索处理
const handleSearch = debounce(() => {
  pagination.page = 1
  fetchRecords()
}, 500)

// 筛选处理
const handleFilter = () => {
  pagination.page = 1
  fetchRecords()
}

// 排序处理
const handleSort = () => {
  fetchRecords()
}

// 分页处理
const handlePageChange = (page) => {
  pagination.page = page
  fetchRecords()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchRecords()
}

// 选择处理
const handleSelectionChange = (selection) => {
  selectedRecords.value = selection
}

const clearSelection = () => {
  selectedRecords.value = []
}

// 预览记录
const previewRecord = (record) => {
  previewRecord.value = record
  previewVisible.value = true
}

// 下载记录
const downloadRecord = (record) => {
  const filename = `webseal-${record.id}-${Date.now()}.png`
  downloadFile(record.watermarkedImage, filename)
  ElMessage.success('下载已开始')
}

// 批量下载
const batchDownload = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }

  batchLoading.value = true
  try {
    for (const record of selectedRecords.value) {
      const filename = `webseal-${record.id}-${Date.now()}.png`
      downloadFile(record.watermarkedImage, filename)
      await new Promise(resolve => setTimeout(resolve, 1000)) // 间隔1秒
    }
    ElMessage.success('批量下载已开始')
  } catch (error) {
    ElMessage.error('批量下载失败')
  } finally {
    batchLoading.value = false
  }
}

// 检测水印
const detectWatermark = (record) => {
  router.push({
    path: '/detect',
    query: { image: record.watermarkedImage }
  })
}

// 删除确认
const confirmDelete = (record) => {
  deleteRecord.value = record
  deleteVisible.value = true
}

const confirmBatchDelete = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await handleBatchDelete()
  } catch (error) {
    // 用户取消删除
  }
}

// 删除处理
const handleDelete = async () => {
  if (!deleteRecord.value) return

  deleteLoading.value = true
  try {
    await websealAPI.deleteRecord(deleteRecord.value.id)
    ElMessage.success('删除成功')
    deleteVisible.value = false
    await fetchRecords()
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 批量删除处理
const handleBatchDelete = async () => {
  batchLoading.value = true
  try {
    const deletePromises = selectedRecords.value.map(record =>
      websealAPI.deleteRecord(record.id)
    )
    await Promise.all(deletePromises)
    
    ElMessage.success(`成功删除 ${selectedRecords.value.length} 条记录`)
    clearSelection()
    await fetchRecords()
  } catch (error) {
    ElMessage.error('批量删除失败')
  } finally {
    batchLoading.value = false
  }
}

// 工具函数
const truncateUrl = (url) => {
  if (url.length > 50) {
    return url.substring(0, 50) + '...'
  }
  return url
}

const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'processing': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed': return '完成'
    case 'failed': return '失败'
    case 'processing': return '处理中'
    default: return '未知'
  }
}

// 初始化
onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  background: #f8fafc;
}

:deep(.el-table__row:hover) {
  background: #f8fafc;
}

/* 缩略图样式 */
.thumbnail {
  object-fit: cover;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  
  .el-table {
    font-size: 12px;
  }
}
</style>
