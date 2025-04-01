import request from '../utils/request'

export const login = async ({ username, password }) => {
  try {
    console.log('发送登录请求，参数:', { username, password })
    const result = await request.post('/user/login', { username, password })
    return result
  } catch (error) {
    console.error('登录请求失败:', error)
    throw error
  }
}

export const register = (data) => {
  return request.post('/user/register', data)
}

export const getUserInfo = () => {
  return request.get('/user/info')
}

export const updateUserInfo = (data) => {
  return request.put('/user/info', data)
}

export const bindRobot = async (robotId) => {
  console.log('开始绑定机器人，ID:', robotId)
  try {
    const result = await request.post(`/robot/${robotId}/bind`)
    console.log('绑定机器人成功:', result)
    return result
  } catch (error) {
    console.error('绑定机器人失败:', error)
    throw error
  }
}

export const getUserStats = () => {
  return request.get('/user/stats')
}

export const getUserSettings = () => {
  return request.get('/user/settings')
}

export const updateUserSettings = (data) => {
  return request.put('/user/settings', data)
}

// 以下为新增的API函数，用于我的页面
/**
 * 获取用户个人资料
 */
export function getUserProfile() {
  return request.get('/user/profile')
}

/**
 * 获取用户积分
 */
export function getUserPoints() {
  return request.get('/user/points')
} 