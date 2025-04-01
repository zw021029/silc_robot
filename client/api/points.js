import request from '../utils/request'

// 获取积分余额
export const getPointsBalance = () => {
  return request.get('/points/balance')
}

// 获取积分明细
export const getPointsHistory = (params) => {
  return request.get('/points/history', { params })
}

// 获取可兑换商品列表
export const getExchangeItems = () => {
  return request.get('/points/exchange/items')
}

// 兑换商品
export const exchangeItem = (itemId) => {
  return request.post('/points/exchange', { itemId })
}

// 获取兑换记录
export const getExchangeHistory = (params) => {
  return request.get('/points/exchange/history', { params })
}

// 获取积分规则
export const getPointsRules = () => {
  return request.get('/points/rules')
}

// 获取积分统计
export const getPointsStats = () => {
  return request.get('/points/stats')
} 