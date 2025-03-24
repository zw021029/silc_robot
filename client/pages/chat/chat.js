import { sendMessage, evaluateChat, getChatPoints } from '../../api/chat'
import { getCurrentRobot } from '../../api/robot'

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
    recording: false
  },

  onLoad() {
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

    this.setData({
      robot: app.globalData.selectedRobot
    })

    this.initSocket()
    this.loadHistory()
    this.loadCurrentRobot()
  },

  onShow() {
    // 检查登录状态和机器人选择状态
    const app = getApp()
    if (!app.globalData.userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

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
      const robotId = app.globalData.selectedRobot?.id
      
      const res = await getChatHistory(robotId)
      this.setData({ 
        messages: res.data.messages || [],
        loading: false
      })
      
      // 滚动到最新消息
      this.scrollToBottom()
      
    } catch (error) {
      wx.showToast({
        title: '加载历史消息失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  handleReceiveMessage(message) {
    const { messages } = this.data
    messages.push(message)
    this.setData({ messages }, () => {
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
    
    const { inputValue, loading, currentRobot } = this.data
    if (!inputValue.trim()) return
    
    if (!currentRobot) {
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
        robotId: currentRobot._id,
        content: inputValue
      })

      // 添加机器人回复
      const robotMessage = {
        _id: res.data._id,
        content: res.data.content,
        createTime: new Date().toLocaleTimeString(),
        robotName: currentRobot.name,
        robotAvatar: currentRobot.avatar,
        isSelf: false
      }

      this.setData({
        messages: [...this.data.messages, robotMessage],
        inputValue: '',
        sending: false
      }, () => {
        this.scrollToBottom()
      })
      
      // 获取本次对话积分
      const pointsRes = await getChatPoints(res.data._id)
      if (pointsRes.data > 0) {
        wx.showToast({
          title: `获得${pointsRes.data}积分`,
          icon: 'none'
        })
      }

    } catch (error) {
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

      // 更新消息状态
      const messages = this.data.messages.map(msg => {
        if (msg._id === messageId) {
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
        url: 'https://silcrobot.willzuo.top/api/chat/voice/upload',
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
      const robotId = app.globalData.selectedRobot?.id

      const uploadRes = await wx.uploadFile({
        url: 'https://silcrobot.willzuo.top/api/chat/image/upload',
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
        id: Date.now(),
        type: 'user',
        content: imageUrl,
        contentType: 'image',
        timestamp: new Date().toISOString()
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
        url: 'https://silcrobot.willzuo.top/api/chat/share/image',
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
  }
}) 