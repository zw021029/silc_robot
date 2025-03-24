import request from '../utils/request'

// 获取机器人列表
export const getRobotList = () => {
  return request.get('/api/robot/list')
}

// 获取机器人详情
export const getRobotDetail = (robotId) => {
  return request.get(`/api/robot/detail/${robotId}`)
}

// 绑定机器人
export const bindRobot = (robotId) => {
  return request.post('/api/robot/bind', { robotId })
}

// 获取当前绑定的机器人
export const getCurrentRobot = () => {
  return request.get('/api/robot/current')
}

// 解绑机器人
export const unbindRobot = () => {
  return request.post('/api/robot/unbind')
} 