const { sendMessage, evaluateChat, getChatPoints } = require('../../api/chat')
const { getCurrentRobot } = require('../../api/robot')
const { getChatHistory } = require('../../api/chat')
const { getUserInfo } = require('../../api/user')
const chatSocket = require('../../utils/socket')
const request = require('../../utils/request')
const { formatTime } = require('../../utils/util')

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
    userInfo: null,
    isPulling: false,  // 是否正在下拉
    pullDistance: 0,   // 下拉距离
    lastScrollTop: 0   // 上次滚动位置
  },

  async onLoad(options) {
    console.log('chat页面加载，options:', options);
    console.log('当前页面robotId:', this.data.robotId);
    console.log('本地存储selectedRobot:', wx.getStorageSync('selectedRobot'));

    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('未检测到token，跳转到登录页');
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 获取用户信息
    await this.loadUserInfo();
    
    // 获取全局数据
    const app = getApp();
    console.log('全局数据:', app.globalData);
    
    // 获取本地存储的机器人信息
    const storedRobot = wx.getStorageSync('selectedRobot');
    console.log('本地存储的机器人:', storedRobot);

    // 检查用户是否选择了机器人
    let selectedRobot = app.globalData.selectedRobot || storedRobot;
    
    if (!selectedRobot) {
      console.log('未选择机器人，尝试从用户信息中获取');
      // 尝试从用户信息中获取已选择的机器人
      const userInfo = wx.getStorageSync('userInfo');
      console.log('本地存储的用户信息:', userInfo);
      
      if (userInfo && userInfo.selectedRobot) {
        console.log('用户已绑定机器人:', userInfo.selectedRobot);
        // 处理可能的命名不一致问题
        let robotId = userInfo.selectedRobot;
        if (robotId === '悉文') robotId = 'xiwen';
        if (robotId === '悉荟') robotId = 'xihui';
        
        // 使用app.js中的方法获取机器人信息
        selectedRobot = app.findRobotInfo(robotId);
        
        if (selectedRobot) {
          console.log('成功获取机器人信息');
          app.globalData.selectedRobot = selectedRobot;
          wx.setStorageSync('selectedRobot', selectedRobot);
        }
      }
    }
    
    if (!selectedRobot) {
      console.log('无法获取机器人信息，提示用户并跳转');
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/robot-select/robot-select'
          });
        }
      });
      return;
    }
    
    console.log('使用机器人:', selectedRobot);
    this.setData({ robot: selectedRobot }, () => {
      this.initSocket();
      this.loadHistory();
    });
  },

  onShow() {    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('未检测到token，跳转到登录页');
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 检查机器人选择状态
    const app = getApp();
    let selectedRobot = app.globalData.selectedRobot || wx.getStorageSync('selectedRobot');
    
    if (!selectedRobot) {
      // 尝试从用户信息中获取已选择的机器人
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.selectedRobot) {
        // 处理可能的命名不一致问题
        let robotId = userInfo.selectedRobot;
        if (robotId === '悉文') robotId = 'xiwen';
        if (robotId === '悉荟') robotId = 'xihui';
        
        // 使用app.js中的方法获取机器人信息
        selectedRobot = app.findRobotInfo(robotId);
        
        if (selectedRobot) {
          app.globalData.selectedRobot = selectedRobot;
          wx.setStorageSync('selectedRobot', selectedRobot);
        }
      }
    }
    
    if (!selectedRobot) {
      console.log('未选择机器人，跳转到选择页面');
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/robot-select/robot-select'
          });
        }
      });
      return;
    }
    
    // 如果当前没有机器人数据，但全局有，则更新
    if (!this.data.robot && selectedRobot) {
      console.log('更新页面机器人数据');
      this.setData({ robot: selectedRobot }, () => {
        // 如果还没有初始化socket，则初始化
        if (!this.socketInitialized) {
          this.initSocket();
          this.loadHistory();
        }
      });
    }
  },

  initSocket() {
    console.log('初始化WebSocket');
    // 初始化WebSocket连接
    chatSocket.connect();
    chatSocket.onMessage(this.handleReceiveMessage.bind(this));
    this.socketInitialized = true;
  },

  async loadHistory() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      // 获取机器人ID，从多个可能的来源获取
      const app = getApp()
      let robotId = null
      
      // 尝试从页面数据获取
      if (this.data.robot && this.data.robot._id) {
        robotId = this.data.robot._id
      } 
      // 尝试从全局数据获取
      else if (app.globalData.selectedRobot && app.globalData.selectedRobot._id) {
        robotId = app.globalData.selectedRobot._id
      }
      // 尝试从本地存储获取
      else {
        const storedRobot = wx.getStorageSync('selectedRobot')
        if (storedRobot && storedRobot._id) {
          robotId = storedRobot._id
        }
      }
      
      console.log('加载历史消息, 机器人ID:', robotId)
      
      if (!robotId) {
        throw new Error('未选择机器人')
      }

      // 使用API获取聊天历史
      const res = await getChatHistory(robotId)
      console.log('获取聊天历史响应:', res)
      
      // 处理不同的响应格式
      let messages = []
      
      if (res && res.success && res.data) {
        // 处理messages字段
        if (res.data.messages && Array.isArray(res.data.messages)) {
          messages = res.data.messages.map(msg => {
            return {
              ...msg,
              isUser: msg.type === 'user',  // 根据消息类型设置isUser标志
              formattedTime: formatTime(new Date(msg.createdAt || new Date()))
            }
          })
        }
      }
      
      console.log(`加载了 ${messages.length} 条历史消息`)
      
      this.setData({ 
        messages: messages,
        loading: false
      }, () => {
        this.scrollToBottom();
      })
      
    } catch (error) {
      console.error('加载历史消息失败:', error)
      wx.showToast({
        title: error.message || '加载历史消息失败',
        icon: 'none'
      })
      this.setData({ 
        loading: false,
        messages: [] // 确保messages是一个空数组
      })
    }
  },

  handleReceiveMessage(message) {
    if (!message) return;
    
    // 确保messages是数组
    const currentMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
    
    // 格式化消息时间
    if (message.createdAt) {
      message.formattedTime = formatTime(new Date(message.createdAt));
    }
    
    const updatedMessages = [...currentMessages, message];
    
    this.setData({ messages: updatedMessages }, () => {
      this.scrollToBottom();
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
    
    const { inputValue, robot } = this.data
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
      // 获取用户ID
      const app = getApp();
      const userId = app.globalData.userId || wx.getStorageSync('userId');
      
      console.log('开始发送消息:', { 
        content: inputValue,
        robotId: robot._id,
        userId: userId
      });
      
      // 发送消息到服务器
      const res = await sendMessage({
        robotId: robot._id,
        content: inputValue,
        userId: userId
      })
      
      console.log('发送消息响应:', res);
      
      if (!res || !res.success || !res.data) {
        throw new Error(res.message || res.error || '发送失败');
      }
      
      const currentMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
      
      // 添加用户消息
      if (res.data.userMessage) {
        const userMessage = {
          _id: res.data.userMessage._id || res.data.userMessage.id,
          id: res.data.userMessage._id || res.data.userMessage.id,
          content: res.data.userMessage.content,
          createdAt: res.data.userMessage.createdAt || new Date().toISOString(),
          time: res.data.userMessage.time || new Date().toISOString(),
          type: 'user',
          isUser: true,
          formattedTime: formatTime(new Date(res.data.userMessage.createdAt || new Date()))
        }
        
        this.setData({
          messages: [...currentMessages, userMessage]
        }, () => {
          this.scrollToBottom();
        })
      }

      // 添加机器人回复
      if (res.data.robotReply) {
        const robotInfo = this.data.robotInfo || {};
        
        const robotMessage = {
          _id: res.data.robotReply._id || res.data.robotReply.id,
          id: res.data.robotReply._id || res.data.robotReply.id,
          content: res.data.robotReply.content,
          createdAt: res.data.robotReply.createdAt || new Date().toISOString(),
          time: res.data.robotReply.time || new Date().toISOString(),
          robotName: robot.name || robotInfo.name || '智能助手',
          robotAvatar: robot.avatar || robotInfo.avatar,
          type: 'robot',
          isUser: false,
          formattedTime: formatTime(new Date(res.data.robotReply.createdAt || new Date()))
        }
        
        const updatedMessages = Array.isArray(this.data.messages) ? this.data.messages : [];
        
        this.setData({
          messages: [...updatedMessages, robotMessage],
          inputValue: '',
          sending: false
        }, () => {
          this.scrollToBottom();
        })
        
        // 获取本次对话积分
        if (res.data.userMessage && res.data.userMessage._id) {
          try {
            const messageId = res.data.userMessage._id;
            console.log('获取聊天积分，消息ID:', messageId);
            
            // 验证消息ID格式
            if (messageId && /^[0-9a-fA-F]{24}$/.test(messageId)) {
              const pointsRes = await getChatPoints(messageId);
              if (pointsRes && pointsRes.data && pointsRes.data.points > 0) {
                wx.showToast({
                  title: `获得${pointsRes.data.points}积分`,
                  icon: 'none'
                });
              }
            } else {
              console.warn('消息ID格式无效，跳过积分获取', { messageId });
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
        url: 'http://127.0.0.1:3005/api/chat/voice/upload',
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
        url: 'http://127.0.0.1:3005/api/chat/image/upload',
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
      }, () => {
        this.scrollToBottom();
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
        url: 'http://127.0.0.1:3005/api/chat/share/image',
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
    if (this.data.messages && this.data.messages.length > 0) {
      const lastMessage = this.data.messages[this.data.messages.length - 1];
      this.setData({
        scrollToMessage: `msg-${lastMessage._id}`
      });
    }
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

  // 上拉加载更多
  onReachBottom() {
    this.loadChatHistory();
  },

  // 加载聊天历史
  async loadChatHistory() {
    try {
      const app = getApp();
      let robotId = this.data.robotId;
      
      // 如果页面中没有设置robotId，则尝试使用应用全局的机器人ID
      if (!robotId && app.globalData && app.globalData.selectedRobot) {
        robotId = app.globalData.selectedRobot._id;
        // 更新页面数据中的robotId
        this.setData({ robotId });
      }
      
      if (!robotId) {
        console.warn('未找到机器人ID，无法加载聊天历史');
        // 不再抛出错误，而是保持现有消息
        wx.showToast({
          title: '请先选择AI助手',
          icon: 'none'
        });
        return;
      }
      
      console.log('加载聊天历史，robotId:', robotId);
      
      const res = await getChatHistory(robotId);
      
      if (res.success) {
        const messagesData = res.data && res.data.messages ? res.data.messages : [];
        
        const formattedMessages = Array.isArray(messagesData) ? 
          messagesData.map(msg => ({
            ...msg,
            isUser: msg.type === 'user'
          })) : [];
          
        // 将新消息追加到现有消息列表的末尾
        const currentMessages = this.data.messages || [];
        this.setData({ 
          messages: [...currentMessages, ...formattedMessages],
          scrollTop: 99999
        });
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      // 不再清空消息，而是显示错误提示
      wx.showToast({
        title: error.message || '加载聊天历史失败',
        icon: 'none'
      });
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

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await getUserInfo()
      console.log('用户信息API返回:', res)
      
      // 检查用户信息响应格式并处理
      if (res.success === false || res.code === 401) {
        console.warn('获取用户信息API返回错误:', res)
        // 设置默认用户信息
        this.setData({ userInfo: { nickname: '我' } })
        return
      }
      
      // 处理不同的响应格式
      let userData = res
      if (res.data) {
        userData = res.data
      } else if (typeof res === 'object' && res._id) {
        userData = res
      }
      
      console.log('设置用户信息:', userData)
      
      // 更新全局数据
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.userInfo = userData;
        
        // 确保在全局保存用户ID
        if (userData && userData._id) {
          app.globalData.userId = userData._id;
          wx.setStorageSync('userId', userData._id);
          console.log('用户ID已设置到全局:', userData._id);
        }
      }
      
      // 更新本地存储
      wx.setStorageSync('userInfo', userData);
      
      this.setData({ userInfo: userData })
    } catch (error) {
      console.error('加载用户信息失败:', error)
      // 设置默认用户信息
      this.setData({ userInfo: { nickname: '我' } })
    }
  },

  // 发送语音消息
  sendVoice(tempFilePath) {
    const self = this;
    const token = wx.getStorageSync('token');
    
    wx.uploadFile({
      url: 'http://127.0.0.1:3005/api/chat/voice/upload',
      filePath: tempFilePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: function(res) {
        console.log('上传语音成功', res);
        self.handleVoiceRecognition(tempFilePath);
      },
      fail: function(error) {
        console.error('上传语音失败', error);
        wx.showToast({
          title: '上传语音失败',
          icon: 'none'
        });
      }
    });
  },

  // 滚动事件处理
  onScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight;
    
    // 记录滚动位置
    this.setData({ lastScrollTop: scrollTop });
    
    // 如果已经滚动到底部，且正在下拉
    if (scrollTop + clientHeight >= scrollHeight && this.data.isPulling) {
      this.loadChatHistory();
      this.setData({ isPulling: false, pullDistance: 0 });
    }
  },

  // 触摸开始事件
  onTouchStart(e) {
    const scrollTop = this.data.lastScrollTop;
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight;
    
    // 如果已经滚动到底部，开始记录下拉
    if (scrollTop + clientHeight >= scrollHeight) {
      this.setData({ isPulling: true });
    }
  },

  // 触摸移动事件
  onTouchMove(e) {
    if (this.data.isPulling) {
      const touch = e.touches[0];
      const startY = this.data.startY;
      const currentY = touch.clientY;
      const pullDistance = startY - currentY;
      
      // 更新下拉距离
      this.setData({ pullDistance });
    }
  },

  // 触摸结束事件
  onTouchEnd() {
    if (this.data.isPulling) {
      this.setData({ isPulling: false, pullDistance: 0 });
    }
  },
}) 