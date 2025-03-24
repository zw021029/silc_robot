import request from '../utils/request'

// 发送消息
export const sendMessage = (data) => {
  return request.post('/api/chat/message', data)
}

// 获取历史消息
export const getHistoryMessages = (params) => {
  return request.get('/api/chat/history', { params })
}

// 评价对话
export const evaluateChat = (data) => {
  return request.post('/api/chat/evaluate', data)
}

// 获取对话评价选项
export const getEvaluationOptions = () => {
  return request.get('/api/chat/evaluation-options')
}

// 获取当前对话积分
export const getChatPoints = (chatId) => {
  return request.get(`/api/chat/points/${chatId}`)
}

export const getChatDetail = (id) => {
  return request.get(`/api/chat/detail/${id}`)
}

export const getChatContext = (robotId) => {
  return request.get(`/api/chat/context/${robotId}`)
}

export const clearChatContext = (robotId) => {
  return request.delete(`/api/chat/context/${robotId}`)
}

export const getRobotConfig = (robotId) => {
  return request.get(`/api/chat/robot/${robotId}/config`)
}

export const updateRobotConfig = (robotId, data) => {
  return request.put(`/api/chat/robot/${robotId}/config`, data)
}

// 语音识别
export const recognizeVoice = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    
    wx.uploadFile({
      url: 'https://silcrobot.willzuo.top/api/chat/voice/recognize',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          wx.redirectTo({
            url: '/pages/login/login'
          })
          reject(new Error('未登录或登录已过期'))
          return
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(res.data))
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

// 语音合成
export const synthesizeVoice = (text) => {
  return request.post('/api/chat/voice/synthesize', { text })
}

// 获取语音设置
export const getVoiceSettings = () => {
  return request.get('/api/chat/voice/settings')
}

// 更新语音设置
export const updateVoiceSettings = (data) => {
  return request.put('/api/chat/voice/settings', data)
}

// 上传图片
export const uploadImage = (data) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    
    wx.uploadFile({
      url: 'https://silcrobot.willzuo.top/api/chat/image/upload',
      filePath: data.filePath,
      name: 'file',
      formData: data.formData,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 401) {
          wx.redirectTo({
            url: '/pages/login/login'
          })
          reject(new Error('未登录或登录已过期'))
          return
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(res.data))
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

// 图片识别
export const recognizeImage = (data) => {
  return request.post('/api/chat/image/recognize', data)
}

// 获取图片上传设置
export const getImageSettings = () => {
  return request.get('/api/chat/image/settings')
}

// 更新图片上传设置
export const updateImageSettings = (data) => {
  return request.put('/api/chat/image/settings', data)
} 