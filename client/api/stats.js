import request from '../utils/request'

// 获取用户统计数据
export const getUserStats = () => {
  return request.get('/api/stats/user')
}

// 获取对话统计数据
export const getChatStats = (params) => {
  return request.get('/api/stats/chat', { params })
}

// 获取机器人统计数据
export const getRobotStats = (robotId) => {
  return request.get(`/api/stats/robot/${robotId}`)
}

// 获取评价统计数据
export const getEvaluationStats = (params) => {
  return request.get('/api/stats/evaluation', { params })
}

// 获取积分统计数据
export const getPointsStats = () => {
  return request.get('/api/stats/points')
}

// 获取系统整体统计数据
export const getSystemStats = () => {
  return request.get('/api/stats/system')
}

// 导出统计数据
export const exportStats = (params) => {
  return request.get('/api/stats/export', { 
    params,
    responseType: 'blob'
  })
} 