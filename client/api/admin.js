import request from '../utils/request'

// 管理员登录
export const adminLogin = (data) => {
  return request.post('/api/admin/login', data)
}

// 获取用户列表
export const getUserList = (params) => {
  return request.get('/api/admin/users', { params })
}

// 获取用户详情
export const getUserDetail = (userId) => {
  return request.get(`/api/admin/users/${userId}`)
}

// 更新用户状态
export const updateUserStatus = (userId, status) => {
  return request.put(`/api/admin/users/${userId}/status`, { status })
}

// 获取对话记录列表
export const getChatList = (params) => {
  return request.get('/api/admin/chats', { params })
}

// 获取对话记录详情
export const getChatDetail = (chatId) => {
  return request.get(`/api/admin/chats/${chatId}`)
}

// 获取知识库列表
export const getKnowledgeList = (params) => {
  return request.get('/api/admin/knowledge', { params })
}

// 上传知识库文件
export const uploadKnowledge = (data) => {
  return request.post('/api/admin/knowledge/upload', data)
}

// 删除知识库
export const deleteKnowledge = (id) => {
  return request.delete(`/api/admin/knowledge/${id}`)
}

// 获取知识库训练状态
export const getTrainingStatus = (id) => {
  return request.get(`/api/admin/knowledge/${id}/status`)
}

// 获取统计数据
export const getStats = (params) => {
  return request.get('/api/admin/stats', { params })
}

// 获取系统设置
export const getSettings = () => {
  return request.get('/api/admin/settings')
}

// 更新系统设置
export const updateSettings = (data) => {
  return request.put('/api/admin/settings', data)
}

// 获取系统统计数据
export const getSystemStats = () => {
  return request.get('/api/admin/stats')
} 