import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    let message = '网络错误'
    
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 400:
          message = data.error || '请求参数错误'
          break
        case 401:
          message = '未授权访问'
          break
        case 403:
          message = '禁止访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = data.error || '服务器内部错误'
          break
        default:
          message = data.error || `请求失败 (${status})`
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        message = '请求超时，请重试'
      } else {
        message = '网络连接失败'
      }
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// API方法
export const websealAPI = {
  // 健康检查
  health() {
    return api.get('/health')
  },

  // 网页截图
  screenshot(data) {
    return api.post('/screenshot', data)
  },

  // 水印检测
  detectWatermark(formData) {
    return api.post('/detect-watermark', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取记录列表
  getRecords(params = {}) {
    return api.get('/records', { params })
  },

  // 获取单个记录
  getRecord(id) {
    return api.get(`/records/${id}`)
  },

  // 删除记录
  deleteRecord(id) {
    return api.delete(`/records/${id}`)
  }
}

export default api
