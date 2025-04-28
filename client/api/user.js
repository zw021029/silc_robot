const request = require('../utils/request')

// 登录
const login = async ({ username, password }) => {
  try {
    console.log('发送登录请求，参数:', { username, password })
    const result = await request.post('/api/user/login', { username, password })
    return result
  } catch (error) {
    console.error('登录请求失败:', error)
    throw error
  }
}

// 注册
const register = (data) => {
  return request.post('/api/user/register', data)
}

// 获取用户信息
const getUserInfo = () => {
  return request.get('/api/user/info')
}

// 更新用户信息
const updateUserInfo = (data) => {
  return request.put('/api/user/info', data)
}

// 绑定机器人
const bindRobot = async (robotId) => {
  console.log('开始绑定机器人，ID:', robotId)
  try {
    const result = await request.post(`/api/robot/${robotId}/bind`)
    console.log('绑定机器人成功:', result)
    return result
  } catch (error) {
    console.error('绑定机器人失败:', error)
    throw error
  }
}

// 获取用户统计信息
const getUserStats = () => {
  return request.get('/api/user/stats')
}

// 获取用户设置
const getUserSettings = () => {
  return request.get('/api/user/settings')
}

// 更新用户设置
const updateUserSettings = (data) => {
  return request.put('/api/user/settings', data)
}

// 获取用户个人资料
const getUserProfile = () => {
  return request.get('/api/user/profile')
}

// 获取用户积分
const getUserPoints = () => {
  return request.get('/api/user/points')
}

// 选择机器人
const selectRobot = (selectedRobot) => {
  return request.post('/api/user/select-robot', { selectedRobot })
}

// 微信登录
const wechatLogin = async ({ code, userInfo }) => {
  try {
    console.log('发送微信登录请求，参数:', { code, userInfo })
    const result = await request.post('/api/user/wechat-login', { code, userInfo })
    return result
  } catch (error) {
    console.error('微信登录请求失败:', error)
    throw error
  }
}

module.exports = {
  login,
  register,
  getUserInfo,
  updateUserInfo,
  bindRobot,
  getUserStats,
  getUserSettings,
  updateUserSettings,
  getUserProfile,
  getUserPoints,
  selectRobot,
  wechatLogin
} 