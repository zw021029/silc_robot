import request from '../utils/request'

// 获取历史记录列表
export const getHistoryList = (params) => {
  return request.get('/api/history/list', { params })
}

// 获取历史记录详情
export const getHistoryDetail = (id) => {
  return request.get(`/api/history/detail/${id}`)
}

// 删除历史记录
export const deleteHistory = (id) => {
  return request.delete(`/api/history/${id}`)
}

// 批量删除历史记录
export const batchDeleteHistory = (ids) => {
  return request.post('/api/history/batch-delete', { ids })
}

// 获取历史记录统计
export const getHistoryStats = () => {
  return request.get('/api/history/stats')
}

// 搜索历史记录
export const searchHistory = (keyword) => {
  return request.get('/api/history/search', { params: { keyword } })
} 