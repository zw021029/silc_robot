import request from '../utils/request'

// 获取积分余额
export const getPointsBalance = () => {
  return request.get('/api/points/balance')
}

// 获取积分明细
export const getPointsHistory = (params) => {
  return request.get('/api/points/history', { params })
}

// 获取可兑换商品列表
export const getExchangeItems = () => {
  return request.get('/api/points/exchange/items')
}

// 兑换商品
export const exchangeItem = (itemId) => {
  return request.post('/api/points/exchange', { itemId })
}

// 获取兑换记录
export const getExchangeHistory = (params) => {
  return request.get('/api/points/exchange/history', { params })
}

// 获取积分规则
export const getPointsRules = () => {
  return request.get('/api/points/rules')
}

// 获取积分统计
export const getPointsStats = () => {
  return request.get('/api/points/stats')
}

// 获取兑换记录
export const getExchangeRecords = (params) => {
  return request.get('/api/points/records', { params })
} 