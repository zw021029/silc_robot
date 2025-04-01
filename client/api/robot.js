const request = require('../utils/request')

// 获取机器人列表
const getRobotList = () => {
  return request.get('/robot/list')
}

// 获取机器人详情
const getRobotDetail = (robotId) => {
  return request.get(`/robot/${robotId}`)
}

// 绑定机器人
const bindRobot = (robotId) => {
  return request.post(`/robot/${robotId}/bind`)
}

// 获取当前绑定的机器人
const getCurrentRobot = () => {
  return request.get('/robot/current')
}

// 解绑机器人
const unbindRobot = () => {
  return request.post('/robot/unbind')
}

module.exports = {
  getRobotList,
  getRobotDetail,
  bindRobot,
  getCurrentRobot,
  unbindRobot
} 