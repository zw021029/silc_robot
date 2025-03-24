import request from '../utils/request'

export const login = async (code) => {
  try {
    console.log('开始登录，code:', code)
    const result = await request.post('/api/user/login', { code })
    console.log('登录结果:', result)
    return result
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

export const register = (data) => {
  return request.post('/api/user/register', data)
}

export const getUserInfo = () => {
  return request.get('/api/user/info')
}

export const updateUserInfo = (data) => {
  return request.put('/api/user/info', data)
}

export const bindRobot = async (robotId) => {
  console.log('开始绑定机器人，ID:', robotId)
  try {
    const result = await request.put('/api/user/bind-robot', { robotId })
    console.log('绑定机器人成功:', result)
    return result
  } catch (error) {
    console.error('绑定机器人失败:', error)
    throw error
  }
}

export const getUserStats = () => {
  return request.get('/api/user/stats')
}

export const getUserSettings = () => {
  return request.get('/api/user/settings')
}

export const updateUserSettings = (data) => {
  return request.put('/api/user/settings', data)
} 