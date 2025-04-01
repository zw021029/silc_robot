const { sendMessage, evaluateChat, getChatPoints } = require('../../api/chat')
const { getCurrentRobot } = require('../../api/robot')
const { getChatHistory } = require('../../api/chat')
const { getUserInfo } = require('../../api/user')
const chatSocket = require('../../utils/socket')
const request = require('../../utils/request')

// 创建事件中心（如果不存在）
if (!wx.eventCenter) {
  wx.eventCenter = {
    events: {},
    on: function(eventName, callback) {
      this.events[eventName] = this.events[eventName] || []
      this.events[eventName].push(callback)
    },
    trigger: function(eventName, data) {
      const callbacks = this.events[eventName] || []
      callbacks.forEach(callback => callback(data))
    },
    off: function(eventName, callback) {
      if (!eventName) {
        this.events = {}
        return
      }
      if (!callback) {
        this.events[eventName] = []
        return
      }
      this.events[eventName] = (this.events[eventName] || []).filter(cb => cb !== callback)
    }
  }
}

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    showEvaluate: false,
    currentMessageId: null,
    isRecording: false,
    recordTime: 0,
    recordTimer: null,
    showImagePreview: false,
    previewImage: '',
    uploadProgress: 0,
    showShareMenu: false,
    currentShareMessage: null,
    sending: false,
    robot: null,
    currentRobot: null,
    scrollTop: 0,
    enableVoice: false,
    recording: false,
    robotId: '',
    robotInfo: null,
    userInfo: null
  },

  async onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 获取用户信息
    this.loadUserInfo()

    // 检查是否选择了机器人
    const app = getApp()
    if (!app.globalData.selectedRobot) {
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
      return
    }

    if (options.robotId) {
      this.setData({ robotId: options.robotId })
      this.loadRobotInfo()
      this.loadChatHistory()
    } else {
      this.setData({
        robot: app.globalData.selectedRobot
      }, () => {
        this.initSocket()
        this.loadHistory()
      })
    }
  },

  onShow() {
    // 检查登录状态和机器人选择状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    const app = getApp()
    if (!app.globalData.selectedRobot) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  initSocket() {
    // 初始化WebSocket连接
    chatSocket.connect()
    chatSocket.onMessage(this.handleReceiveMessage.bind(this))
  },

  async loadHistory() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const app = getApp()
      const robotId = app.globalData.selectedRobot?._id
      
      if (!robotId) {
        throw new Error('未选择机器人')
      }

      const res = await getChatHistory(robotId)
      
      // 处理历史消息，确保每条消息都有isUser标志
      let messages = [];
      if (Array.isArray(res.data)) {
        messages = res.data.map(msg => {
          return {
            ...msg,
            isUser: msg.type === 'user'  // 根据消息类型设置isUser标志
          };
        });
      }
      
      this.setData({ 
        messages: messages,
        loading: false
      })
      
      // 滚动到最新消息
      this.scrollToBottom()
      
    } catch (error) {
      console.error('加载历史消息失败:', error)
      wx.showToast({
        title: error.message || '加载历史消息失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  handleReceiveMessage(message) {
    if (!message) return;
    
    // 确保messages是数组
    const currentMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
    const updatedMessages = [...currentMessages, message];
    
    this.setData({ messages: updatedMessages }, () => {
      this.scrollToBottom()
    })
  },

  // 输入框事件
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 发送消息
  async handleSend() {
    if (this.data.sending) return
    
    const { inputValue, loading, robot } = this.data
    if (!inputValue.trim()) return
    
    if (!robot) {
      wx.showToast({
        title: '请先选择机器人',
        icon: 'none'
      })
      return
    }

    this.setData({ sending: true })
    
    try {
      // 发送消息到服务器
      const res = await sendMessage({
        robotId: robot._id,
        content: inputValue
      })
      
      console.log('发送消息响应', res);
      
      // 检查响应格式是否正确
      if (!res.success || !res.data) {
        throw new Error(res.error || '发送失败');
      }
      
      // 确保messages是数组
      const currentMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
      
      // 添加用户消息
      if (res.data.userMessage) {
        const userMessage = {
          _id: res.data.userMessage._id || res.data.userMessage.id,
          content: res.data.userMessage.content,
          createdAt: res.data.userMessage.createdAt || new Date().toLocaleTimeString(),
          type: 'user',
          isUser: true
        }
        
        // 将用户消息添加到消息列表
        this.setData({
          messages: [...currentMessages, userMessage]
        })
      }

      // 添加机器人回复
      if (res.data.robotReply) {
        // 获取正确的机器人信息
        const robotInfo = this.data.robotInfo || {};
        
        const robotMessage = {
          _id: res.data.robotReply._id || res.data.robotReply.id,
          content: res.data.robotReply.content,
          createdAt: res.data.robotReply.createdAt || new Date().toLocaleTimeString(),
          robotName: robot.name || robotInfo.name || '智能助手',
          robotAvatar: robot.avatar || robotInfo.avatar,
          type: 'robot',
          isUser: false
        }
        
        // 重新获取最新的messages数组
        const updatedMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
        
        // 将机器人回复添加到消息列表
        this.setData({
          messages: [...updatedMessages, robotMessage],
          inputValue: '',
          sending: false
        }, () => {
          this.scrollToBottom()
        })
        
        // 获取本次对话积分
        if (res.data.userMessage && res.data.userMessage._id) {
          try {
            const pointsRes = await getChatPoints(res.data.userMessage._id)
            if (pointsRes.data > 0) {
              wx.showToast({
                title: `获得${pointsRes.data}积分`,
                icon: 'none'
              })
            }
          } catch (pointsError) {
            console.error('获取积分失败', pointsError);
          }
        }
      } else {
        this.setData({ sending: false });
        console.error('机器人回复为空');
      }
    } catch (error) {
      console.error('发送消息错误', error);
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
      this.setData({ sending: false })
    }
  },

  // 评价对话
  async handleEvaluate(e) {
    const { messageId, score } = e.detail
    
    try {
      await evaluateChat({
        messageId,
        score
      })

      // 确保messages是数组
      if (!Array.isArray(this.data.messages)) {
        this.setData({ messages: [] });
        return;
      }

      // 更新消息状态
      const messages = this.data.messages.map(msg => {
        if (msg && msg._id === messageId) {
          return { ...msg, evaluated: true, score }
        }
        return msg
      })

      this.setData({ messages })

      wx.showToast({
        title: '评价成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '评价失败',
        icon: 'none'
      })
    }
  },

  // 开始录音
  async handleStartRecord() {
    try {
      const res = await wx.authorize({
        scope: 'scope.record'
      })

      this.setData({ 
        isRecording: true,
        recordTime: 0
      })

      // 开始计时
      this.data.recordTimer = setInterval(() => {
        this.setData({
          recordTime: this.data.recordTime + 1
        })
      }, 1000)

      // 开始录音
      const recorderManager = wx.getRecorderManager()
      recorderManager.start({
        duration: 60000, // 最长一分钟
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      })

      // 监听录音结束
      recorderManager.onStop((res) => {
        this.handleVoiceRecognition(res.tempFilePath)
      })

    } catch (error) {
      wx.showToast({
        title: '请授权录音权限',
        icon: 'none'
      })
    }
  },

  // 结束录音
  handleStopRecord() {
    if (!this.data.isRecording) return

    clearInterval(this.data.recordTimer)
    this.setData({ 
      isRecording: false,
      recordTime: 0,
      recordTimer: null
    })

    const recorderManager = wx.getRecorderManager()
    recorderManager.stop()
  },

  // 语音识别
  async handleVoiceRecognition(tempFilePath) {
    try {
      wx.showLoading({
        title: '识别中...'
      })

      // 上传录音文件
      const uploadRes = await wx.uploadFile({
        url: 'http://localhost:3003/api/chat/voice/upload',
        filePath: tempFilePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        }
      })

      const { text } = JSON.parse(uploadRes.data)
      
      // 设置输入框内容
      this.setData({
        inputValue: text
      })

      // 自动发送消息
      await this.handleSend()

    } catch (error) {
      wx.showToast({
        title: error.message || '语音识别失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择图片
  async handleChooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = res.tempFilePaths[0]
      await this.uploadImage(tempFilePath)

    } catch (error) {
      if (error.errMsg !== 'chooseImage:fail cancel') {
        wx.showToast({
          title: error.message || '选择图片失败',
          icon: 'none'
        })
      }
    }
  },

  // 上传图片
  async uploadImage(tempFilePath) {
    try {
      wx.showLoading({
        title: '正在上传...'
      })

      const app = getApp()
      const robotId = app.globalData.selectedRobot?._id

      const uploadRes = await wx.uploadFile({
        url: 'http://localhost:3003/api/chat/image/upload',
        filePath: tempFilePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        formData: {
          robotId
        }
      })

      const { imageUrl, question } = JSON.parse(uploadRes.data)

      // 添加图片消息到列表
      const imageMessage = {
        _id: Date.now().toString(),
        type: 'user',
        content: imageUrl,
        contentType: 'image',
        createTime: new Date().toLocaleTimeString(),
        isSelf: true
      }

      this.setData({
        messages: [...this.data.messages, imageMessage],
        inputValue: question || ''
      })

      // 如果有识别出的问题，自动发送
      if (question) {
        await this.handleSend()
      }

    } catch (error) {
      wx.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 预览图片
  handlePreviewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },

  // 显示分享菜单
  handleShowShare(e) {
    const { messageId } = e.currentTarget.dataset
    const message = this.data.messages.find(m => m.id === messageId)
    
    this.setData({
      showShareMenu: true,
      currentShareMessage: message
    })
  },

  // 隐藏分享菜单
  handleHideShare() {
    this.setData({
      showShareMenu: false,
      currentShareMessage: null
    })
  },

  // 分享到朋友圈
  async handleShareTimeline() {
    try {
      const { currentShareMessage } = this.data
      if (!currentShareMessage) return

      // 生成分享图片
      const res = await wx.downloadFile({
        url: 'http://localhost:3003/api/chat/share/image',
        data: {
          messageId: currentShareMessage.id
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        }
      })

      await wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath
      })

      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      })

    } catch (error) {
      wx.showToast({
        title: error.message || '分享失败',
        icon: 'none'
      })
    } finally {
      this.handleHideShare()
    }
  },

  // 分享给朋友
  onShareAppMessage(res) {
    if (res.from === 'button') {
      const { currentShareMessage } = this.data
      if (!currentShareMessage) return

      return {
        title: '来自AI助手的回答',
        path: `/pages/chat/detail/detail?id=${currentShareMessage.id}`,
        imageUrl: '/assets/images/share-default.png'
      }
    }
    
    return {
      title: '悉商问答系统',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-default.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '悉商问答系统 - AI智能问答',
      query: '',
      imageUrl: '/assets/images/share-default.png'
    }
  },

  scrollToBottom() {
    wx.createSelectorQuery()
      .select('#message-list')
      .boundingClientRect((rect) => {
        if (rect) {
          wx.pageScrollTo({
            scrollTop: rect.height,
            duration: 300
          })
        }
      })
      .exec()
  },

  onUnload() {
    chatSocket.close()
  },

  // 加载当前机器人信息
  async loadCurrentRobot() {
    try {
      const res = await getCurrentRobot()
      this.setData({ currentRobot: res.data })
    } catch (error) {
      wx.showToast({
        title: '获取机器人信息失败',
        icon: 'none'
      })
    }
  },

  // 切换语音输入
  toggleVoiceInput() {
    this.setData({ enableVoice: !this.data.enableVoice })
  },

  // 开始录音
  startRecording() {
    this.setData({ recording: true })
    // 实现录音逻辑
  },

  // 结束录音
  endRecording() {
    this.setData({ recording: false })
    // 实现语音转文字逻辑
  },

  // 处理输入变化
  handleInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 加载机器人信息
  async loadRobotInfo() {
    try {
      // 添加日志
      console.log('加载机器人信息, robotId:', this.data.robotId)
      
      const app = getApp()
      // 如果没有从options传入robotId，则使用全局选择的机器人
      const robotId = this.data.robotId || app.globalData.selectedRobot?._id
      
      if (!robotId) {
        console.error('未找到机器人ID')
        return
      }
      
      const res = await request.get(`/api/robot/${robotId}`)
      console.log('机器人信息API返回:', res)
      
      // 检查正确的响应格式
      if ((res.success || res.code === 0) && res.data) {
        console.log('获取到机器人信息:', res.data)
        this.setData({ robotInfo: res.data })
      } else {
        console.error('加载机器人信息失败:', res)
        // 设置默认机器人信息
        this.setData({ 
          robotInfo: { 
            name: '智能助手', 
            description: '随时为您解答问题' 
          } 
        })
      }
    } catch (error) {
      console.error('加载机器人信息失败:', error)
      // 设置默认机器人信息
      this.setData({ 
        robotInfo: { 
          name: '智能助手', 
          description: '随时为您解答问题' 
        } 
      })
    }
  },

  // 加载聊天历史
  async loadChatHistory() {
    try {
      const res = await request.get('/api/chat/history')
      if (res.success) {
        const messagesData = res.data && res.data.messages ? res.data.messages : [];
        
        // 处理历史消息，确保每条消息都有isUser标志
        const formattedMessages = Array.isArray(messagesData) ? 
          messagesData.map(msg => ({
            ...msg,
            isUser: msg.type === 'user'  // 根据消息类型设置isUser标志
          })) : [];
          
        this.setData({ 
          messages: formattedMessages,
          scrollTop: 99999 // 滚动到底部
        })
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      // 确保messages是一个空数组，而不是undefined或null
      this.setData({ messages: [] })
    }
  },

  // 点击发送按钮
  onSend() {
    this.handleSend()
  },

  // 回车发送
  onConfirm() {
    this.handleSend()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadChatHistory().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await getUserInfo()
      console.log('用户信息API返回:', res)
      
      // 检查不同格式的成功响应 (success 或 code === 0)
      if ((res.success || res.code === 0) && res.data) {
        console.log('获取到用户信息:', res.data)
        this.setData({ userInfo: res.data })
      } else {
        console.error('获取用户信息失败:', res)
        // 设置默认用户信息
        this.setData({ userInfo: { nickname: '我' } })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      // 设置默认用户信息
      this.setData({ userInfo: { nickname: '我' } })
    }
  }
}) 