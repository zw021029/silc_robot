import request from '../utils/request'

// 管理员登录
export const adminLogin = (data: { username: string; password: string }) => {
  return request.post('/api/admin/login', data)
}

// 获取用户列表
export const getUserList = (params: { page: number; pageSize: number }) => {
  return request.get('/api/admin/users', { params })
}

// 获取用户详情
export const getUserDetail = (userId: string) => {
  return request.get(`/api/admin/users/${userId}`)
}

// 更新用户状态
export const updateUserStatus = (userId: string, status: number) => {
  return request.put(`/api/admin/users/${userId}/status`, { status })
}

// 获取对话记录列表
export const getChatList = (params: { 
  page: number; 
  pageSize: number;
  search?: string;
  status?: string;
}) => {
  return request.get('/api/admin/chats', { params })
}

// 获取对话记录详情
export const getChatDetail = (chatId: string) => {
  return request.get(`/api/admin/chats/${chatId}`)
}

// 获取知识库列表
export const getKnowledgeList = (params: { page: number; pageSize: number; category?: string; keyword?: string }) => {
  return request.get('/api/admin/knowledge', { params })
}

// 上传知识库文件
export const uploadKnowledge = (data: FormData) => {
  return request.post('/api/admin/knowledge/upload', data)
}

// 删除知识库
export const deleteKnowledge = (id: string) => {
  return request.delete(`/api/admin/knowledge/${id}`)
}

// 修改知识库
export const updateKnowledge = (id: string, data: any) => {
  return request.put(`/api/admin/knowledge/${id}`, data)
}

// 获取统计数据
export const getStats = (params: { startDate: string; endDate: string }) => {
  return request.get('/api/admin/stats', { params })
}

// 获取用户反馈
export const getFeedbackList = (params: { page: number; pageSize: number, search?: string, type?: string, status?: string }) => {
  return request.get('/api/admin/feedback', { params })
}

// 获取对话历史
export const getChatHistory = (params: { page: number; pageSize: number }) => {
  return request.get('/api/admin/chat-history', { params })
}

// 添加知识库
export const addKnowledge = (data: any) => {
  return request.post('/api/admin/knowledge', data)
}

// 处理知识库文件
export const processTextFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/admin/knowledge/process-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}