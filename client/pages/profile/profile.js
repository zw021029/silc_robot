// pages/profile/profile.js
import request from '../../utils/request'
import { getUserStats } from '../../api/user'
import { getUserTasks, updateTaskProgress, completeTask, TASK_TYPES } from '../../api/task'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    userLevel: 1,
    levelProgress: 45,
    points: 0,
    
    // AI相关数据
    aiInfo: {
      name: 'SILC助手',
      avatarUrl: '/assets/images/robot-avatar.png',
      online: true,
      mood: '开心',
      moodEmoji: '😊',
      description: '我是你的AI伙伴，随时为你提供帮助和陪伴',
      evolutionLevel: 2
    },
    intimacyLevel: '知己',
    intimacyProgress: 75,
    
    // 今日任务
    dailyDialogCount: 3,
    dailyTaskCompleted: false,
    
    // 对话统计
    dialogStats: {
      total: 128,
      likes: 32,
      solved: 86
    },
    newHistoryCount: 3,
    
    // AI能力
    aiAbilities: [
      { name: '闲聊', level: 5 },
      { name: '专业知识', level: 4 },
      { name: '创意', level: 3 },
      { name: '幽默感', level: 3 },
      { name: '同理心', level: 4 }
    ],
    
    // 进化阶段
    evolutionStages: [
      { level: 1, name: '初始形态' },
      { level: 2, name: '进阶助手' },
      { level: 3, name: '智能顾问' },
      { level: 4, name: '知心伙伴' },
      { level: 5, name: '超级智友' }
    ],
    
    // 弹窗控制
    showAiDetailModal: false,
    
    // 任务系统
    tasks: [
      { id: 1, name: '每日对话', desc: '与AI进行5次对话', reward: 10, progress: 3, max: 5, completed: false },
      { id: 2, name: '收藏对话', desc: '收藏1次精彩对话', reward: 5, progress: 0, max: 1, completed: false },
      { id: 3, name: '自定义形象', desc: '定制AI形象外观', reward: 20, progress: 0, max: 1, completed: false }
    ],
    
    // 成就系统
    achievements: [
      { id: 1, name: '初次对话', desc: '与AI完成第一次对话', reward: 10, unlocked: true },
      { id: 2, name: '对话达人', desc: '累计对话次数达到100次', reward: 50, unlocked: true },
      { id: 3, name: '知识探索者', desc: '使用AI解答20个专业问题', reward: 30, unlocked: false, progress: 15, total: 20 }
    ],
    
    // 推荐系统
    recommendations: [
      { type: 'skill', name: '语音识别技能', desc: '让你的AI助手能够识别语音指令', points: 100 },
      { type: 'appearance', name: '限定形象：星空', desc: '璀璨星空主题的AI形象', points: 200 }
    ],
    
    // 通知系统
    notifications: [
      { id: 1, title: '任务完成', content: '恭喜你完成每日对话任务', time: '今天', read: false },
      { id: 2, title: '积分到账', content: '你获得了50积分奖励', time: '昨天', read: true }
    ],
    showNotificationBadge: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      // 已登录，获取用户信息和任务
      this.getUserInfoFromServer()
      this.getTasksFromServer()
    } else {
      // 未登录，使用本地模拟数据
      this.getUserInfoLocal()
    }
    
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 监听全局事件
    this.setupEventListeners()
  },

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听聊天完成事件
    wx.eventCenter = wx.eventCenter || {}
    wx.eventCenter.on = wx.eventCenter.on || function(eventName, callback) {
      this[eventName] = this[eventName] || []
      this[eventName].push(callback)
    }
    wx.eventCenter.trigger = wx.eventCenter.trigger || function(eventName, data) {
      const callbacks = this[eventName] || []
      callbacks.forEach(callback => callback(data))
    }
    
    // 监听聊天完成事件
    wx.eventCenter.on('chat-completed', this.updateChatStats.bind(this))
    
    // 监听积分变化事件
    wx.eventCenter.on('points-updated', this.updatePoints.bind(this))
    
    // 监听AI互动事件
    wx.eventCenter.on('ai-interaction', this.updateAiRelationship.bind(this))
  },

  /**
   * 获取用户信息（本地模拟）
   */
  async getUserInfoLocal() {
    try {
      // 尝试从本地存储或内存中获取用户信息
      const app = getApp()
      let userInfo = app.globalData?.userInfo
      
      // 如果全局状态没有用户信息，尝试从本地缓存获取
      if (!userInfo) {
        userInfo = wx.getStorageSync('userInfo') || {}
      }
      
      // 如果仍无法获得用户信息，使用默认数据
      if (!userInfo || !userInfo.nickName) {
        userInfo = {
          nickName: '用户',
          avatarUrl: '/assets/images/default-avatar.png'
        }
      }
      
      // 获取积分和对话数据
      const pointsData = wx.getStorageSync('pointsData') || { balance: 128 }
      const dialogData = wx.getStorageSync('dialogData') || { 
        total: 128, 
        likes: 32, 
        solved: 86,
        newCount: 3
      }
      
      // 计算用户等级 (基于对话总数和积分)
      const totalExp = Math.floor(dialogData.total * 1.5 + pointsData.balance * 0.5)
      const userLevel = this.calculateLevel(totalExp)
      const levelProgress = this.calculateLevelProgress(totalExp, userLevel)
      
      this.setData({
        userInfo: userInfo,
        hasUserInfo: !!userInfo.nickName,
        userLevel: userLevel,
        levelProgress: levelProgress,
        points: pointsData.balance || 128,
        dialogStats: {
          total: dialogData.total || 128,
          likes: dialogData.likes || 32,
          solved: dialogData.solved || 86
        },
        newHistoryCount: dialogData.newCount || 3,
        dailyDialogCount: dialogData.dailyCount || 3,
        dailyTaskCompleted: dialogData.dailyCount >= 5
      })
      
      // 更新AI情感状态
      this.updateAiMood()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      this.setData({
        userInfo: {
          nickName: '用户',
          avatarUrl: '/assets/images/default-avatar.png'
        },
        hasUserInfo: false,
        userLevel: 1,
        levelProgress: 0,
        points: 0
      })
    }
  },
  
  /**
   * 计算用户等级
   */
  calculateLevel(exp) {
    if (exp < 100) return 1
    if (exp < 300) return 2
    if (exp < 600) return 3
    if (exp < 1000) return 4
    return 5
  },
  
  /**
   * 计算等级进度条
   */
  calculateLevelProgress(exp, level) {
    const levelThresholds = [0, 100, 300, 600, 1000, 2000]
    const currentLevelExp = exp - levelThresholds[level - 1]
    const nextLevelExp = levelThresholds[level] - levelThresholds[level - 1]
    return Math.floor((currentLevelExp / nextLevelExp) * 100)
  },
  
  /**
   * 更新AI心情
   * 基于用户互动频率和点赞率决定AI心情
   */
  updateAiMood() {
    const dialogData = wx.getStorageSync('dialogData') || {}
    let mood = '平静'
    let moodEmoji = '😐'
    
    // 根据最近互动频率和质量决定心情
    const recentDialogs = dialogData.recentDialogs || 0
    const likeRate = dialogData.total > 0 ? dialogData.likes / dialogData.total : 0
    
    if (recentDialogs > 5 && likeRate > 0.3) {
      mood = '开心'
      moodEmoji = '😊'
    } else if (recentDialogs > 2) {
      mood = '放松'
      moodEmoji = '😌'
    } else if (recentDialogs < 1 && dialogData.total > 10) {
      mood = '想念你'
      moodEmoji = '🥺'
    }
    
    this.setData({
      'aiInfo.mood': mood,
      'aiInfo.moodEmoji': moodEmoji
    })
  },
  
  /**
   * 根据数值获取亲密度等级
   */
  getIntimacyLevel(value) {
    if (value < 20) return '初识'
    if (value < 40) return '熟悉'
    if (value < 60) return '朋友'
    if (value < 80) return '知己'
    return '挚友'
  },
  
  /**
   * 更新任务完成状态
   */
  updateTaskStatus() {
    const dailyDialogCount = this.data.dailyDialogCount
    const tasks = this.data.tasks
    
    // 更新每日对话任务
    tasks[0].progress = dailyDialogCount
    tasks[0].completed = dailyDialogCount >= tasks[0].max
    
    // 更新收藏任务
    const favoriteCount = wx.getStorageSync('favoriteCount') || 0
    tasks[1].progress = favoriteCount
    tasks[1].completed = favoriteCount >= tasks[1].max
    
    // 更新自定义形象任务
    const hasCustomizedAppearance = wx.getStorageSync('hasCustomizedAppearance') || false
    tasks[2].progress = hasCustomizedAppearance ? 1 : 0
    tasks[2].completed = hasCustomizedAppearance
    
    this.setData({ tasks, dailyTaskCompleted: tasks[0].completed })
  },
  
  /**
   * 更新聊天统计数据
   */
  updateChatStats(data) {
    const dialogStats = this.data.dialogStats
    dialogStats.total += 1
    
    if (data && data.isLiked) {
      dialogStats.likes += 1
    }
    
    if (data && data.isSolved) {
      dialogStats.solved += 1
    }
    
    // 更新每日对话计数
    let dailyDialogCount = this.data.dailyDialogCount + 1
    const dailyTaskCompleted = dailyDialogCount >= 5
    
    this.setData({
      dialogStats,
      dailyDialogCount,
      dailyTaskCompleted
    })
    
    // 存储更新后的数据
    wx.setStorageSync('dialogData', {
      ...dialogStats,
      dailyCount: dailyDialogCount,
      recentDialogs: (wx.getStorageSync('dialogData')?.recentDialogs || 0) + 1
    })
    
    // 尝试调用服务器更新任务进度
    this.updateTaskProgressOnServer('daily_chat')
    
    // 更新AI心情
    this.updateAiMood()
  },
  
  /**
   * 在服务器上更新任务进度
   */
  async updateTaskProgressOnServer(taskType, increment = 1) {
    // 如果未登录，直接返回
    if (!wx.getStorageSync('token')) {
      return
    }
    
    try {
      const res = await request({
        url: '/api/tasks/progress',
        method: 'POST',
        data: {
          taskType,
          progressIncrement: increment
        }
      })
      
      if (res && res.data && res.data.success) {
        const task = res.data.data
        
        // 如果任务完成，显示提示
        if (task.completed && !this.data.tasks.find(t => t.id === task._id || t.name === task.name)?.completed) {
          wx.showToast({
            title: '任务完成! +' + task.rewardPoints + '积分',
            icon: 'success',
            duration: 2000
          })
          
          // 刷新任务数据
          this.getTasksFromServer()
          // 刷新用户积分
          this.getUserInfoFromServer()
        }
      }
    } catch (error) {
      console.error('更新任务进度失败:', error)
    }
  },
  
  /**
   * 完成任务
   */
  completeTask(taskIndex) {
    const tasks = this.data.tasks
    if (taskIndex >= tasks.length || tasks[taskIndex].completed) return
    
    // 调用服务器接口完成任务
    if (wx.getStorageSync('token')) {
      const taskType = this.getTaskTypeByIndex(taskIndex)
      if (taskType) {
        this.completeTaskOnServer(taskType)
        return
      }
    }
    
    // 本地任务完成逻辑（兼容模式）
    tasks[taskIndex].completed = true
    this.setData({ tasks })
    
    // 奖励积分
    this.updatePoints({
      amount: tasks[taskIndex].reward,
      reason: '完成任务：' + tasks[taskIndex].name
    })
    
    // 发送事件通知
    if (wx.eventCenter) {
      wx.eventCenter.trigger('task-completed', {
        taskId: tasks[taskIndex].id,
        taskName: tasks[taskIndex].name
      })
    }
  },
  
  /**
   * 根据索引获取任务类型
   */
  getTaskTypeByIndex(index) {
    // 映射任务索引到任务类型
    const typeMap = {
      0: 'daily_chat',
      1: 'favorite_dialog',
      2: 'customize_appearance'
    }
    return typeMap[index]
  },
  
  /**
   * 在服务器上完成任务
   */
  async completeTaskOnServer(taskType) {
    try {
      const res = await request({
        url: '/api/tasks/complete',
        method: 'POST',
        data: { taskType }
      })
      
      if (res && res.data && res.data.success) {
        const task = res.data.data
        
        wx.showToast({
          title: '任务完成! +' + task.rewardPoints + '积分',
          icon: 'success',
          duration: 2000
        })
        
        // 刷新任务数据
        this.getTasksFromServer()
        // 刷新用户积分
        this.getUserInfoFromServer()
      }
    } catch (error) {
      console.error('完成任务失败:', error)
    }
  },
  
  /**
   * 更新积分
   */
  updatePoints(data) {
    if (!data || !data.amount) return
    
    const currentPoints = this.data.points
    const newPoints = currentPoints + data.amount
    
    this.setData({
      points: newPoints,
      'notifications': [{
        id: Date.now(),
        title: '积分' + (data.amount > 0 ? '到账' : '消费'),
        content: (data.amount > 0 ? '获得了' : '使用了') + Math.abs(data.amount) + '积分' + (data.reason ? `(${data.reason})` : ''),
        time: '刚刚',
        read: false
      }, ...this.data.notifications.slice(0, 4)],
      showNotificationBadge: true
    })
    
    // 存储更新后的积分
    wx.setStorageSync('pointsData', { balance: newPoints })
    
    // 重新计算用户等级
    const totalExp = Math.floor(this.data.dialogStats.total * 1.5 + newPoints * 0.5)
    const userLevel = this.calculateLevel(totalExp)
    const levelProgress = this.calculateLevelProgress(totalExp, userLevel)
    
    if (userLevel > this.data.userLevel) {
      // 用户升级
      wx.showToast({
        title: '恭喜升级到Lv.' + userLevel,
        icon: 'success',
        duration: 2000
      })
    }
    
    this.setData({
      userLevel,
      levelProgress
    })
  },
  
  /**
   * 更新AI关系
   */
  updateAiRelationship(data) {
    if (!data) return
    
    // 更新亲密度
    let intimacyChange = 0
    
    if (data.type === 'chat') {
      intimacyChange = 2
    } else if (data.type === 'customize') {
      intimacyChange = 5
    } else if (data.type === 'like') {
      intimacyChange = 3
    }
    
    // 获取当前亲密度
    const storedIntimacy = wx.getStorageSync('intimacyLevel') || 60
    let newIntimacy = storedIntimacy + intimacyChange
    if (newIntimacy > 100) newIntimacy = 100
    
    // 更新亲密度等级和进度
    const intimacyLevel = this.getIntimacyLevel(newIntimacy)
    
    this.setData({
      intimacyLevel,
      intimacyProgress: newIntimacy
    })
    
    // 存储新亲密度
    wx.setStorageSync('intimacyLevel', newIntimacy)
    
    // 检查AI进化
    this.checkAiEvolution(newIntimacy)
  },
  
  /**
   * 检查AI进化条件
   */
  checkAiEvolution(intimacy) {
    const currentLevel = this.data.aiInfo.evolutionLevel
    let newLevel = currentLevel
    
    // 基于亲密度和对话质量决定进化
    if (intimacy >= 90 && this.data.dialogStats.total >= 200) {
      newLevel = 5
    } else if (intimacy >= 75 && this.data.dialogStats.total >= 100) {
      newLevel = 4
    } else if (intimacy >= 60 && this.data.dialogStats.total >= 50) {
      newLevel = 3
    } else if (intimacy >= 40 && this.data.dialogStats.total >= 20) {
      newLevel = 2
    }
    
    // 如果等级提升，显示进化动画
    if (newLevel > currentLevel) {
      this.setData({
        'aiInfo.evolutionLevel': newLevel
      })
      
      wx.showToast({
        title: 'AI进化到了新阶段！',
        icon: 'success',
        duration: 2000
      })
      
      // 奖励积分
      this.updatePoints({
        amount: newLevel * 20,
        reason: 'AI进化到' + this.data.evolutionStages[newLevel-1].name
      })
    }
  },
  
  /**
   * 完成每日对话任务
   */
  completeDailyTask() {
    // 跳转到聊天页面
    wx.switchTab({
      url: '/pages/chat/chat'
    })
  },
  
  /**
   * 显示AI详情
   */
  showAiDetail() {
    this.setData({
      showAiDetailModal: true
    })
  },
  
  /**
   * 隐藏AI详情
   */
  hideAiDetail() {
    this.setData({
      showAiDetailModal: false
    })
  },
  
  /**
   * 阻止弹窗背景滚动
   */
  preventTouchMove() {
    return false
  },
  
  /**
   * 跳转到积分页面
   */
  goToPoints() {
    wx.navigateTo({
      url: '/pages/points/points'
    })
  },
  
  /**
   * 跳转到对话历史页面
   */
  goToDialogHistory() {
    wx.navigateTo({
      url: '/pages/dialog/history/history'
    })
  },
  
  /**
   * 跳转到收藏对话页面
   */
  goToFavoriteDialogs() {
    wx.navigateTo({
      url: '/pages/dialog/favorite/favorite'
    })
  },
  
  /**
   * 跳转到AI记忆页面
   */
  goToAiMemory() {
    wx.navigateTo({
      url: '/pages/ai/memory/memory'
    })
  },
  
  /**
   * 跳转到对话分析页面
   */
  goToDialogAnalysis() {
    wx.navigateTo({
      url: '/pages/dialog/analysis/analysis'
    })
  },
  
  /**
   * 跳转到AI性格页面
   */
  goToAiPersonality() {
    wx.navigateTo({
      url: '/pages/ai/personality/personality'
    })
  },
  
  /**
   * 跳转到AI外观页面
   */
  goToAiAppearance() {
    wx.navigateTo({
      url: '/pages/ai/appearance/appearance'
    })
  },
  
  /**
   * 跳转到AI技能中心
   */
  goToAiSkills() {
    wx.navigateTo({
      url: '/pages/ai/skills/skills'
    })
  },
  
  /**
   * 跳转到AI语音设置
   */
  goToAiVoice() {
    wx.navigateTo({
      url: '/pages/ai/voice/voice'
    })
  },
  
  /**
   * 跳转到反馈页面
   */
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },
  
  /**
   * 跳转到关于页面
   */
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新获取数据
    const token = wx.getStorageSync('token')
    if (token) {
      // 已登录，获取服务器数据
      this.getUserInfoFromServer()
      this.getTasksFromServer()
    } else {
      // 未登录，使用本地数据
      this.getUserInfoLocal()
      this.updateTaskStatus()
    }
    
    // 如果有未读通知，显示小红点
    this.checkNotifications()
  },
  
  /**
   * 检查通知
   */
  checkNotifications() {
    const hasUnread = this.data.notifications.some(item => !item.read)
    this.setData({
      showNotificationBadge: hasUnread
    })
  },
  
  /**
   * 阅读所有通知
   */
  readAllNotifications() {
    const notifications = this.data.notifications.map(item => ({
      ...item,
      read: true
    }))
    
    this.setData({
      notifications,
      showNotificationBadge: false
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 移除事件监听
    if (wx.eventCenter) {
      wx.eventCenter.off && wx.eventCenter.off('chat-completed')
      wx.eventCenter.off && wx.eventCenter.off('points-updated')
      wx.eventCenter.off && wx.eventCenter.off('ai-interaction')
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 刷新数据
    this.getUserInfoLocal()
    this.updateTaskStatus()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的AI助手',
      path: '/pages/index/index'
    }
  },

  /**
   * 从服务器获取用户信息
   */
  async getUserInfoFromServer() {
    try {
      const res = await request({
        url: '/api/user/info',
        method: 'GET'
      })
      
      if (res && res.data && res.data.success) {
        const userInfo = res.data.data
        
        // 设置用户基本信息
        this.setData({
          userInfo: {
            nickName: userInfo.nickname || userInfo.username,
            avatarUrl: userInfo.avatar || '/assets/images/default-avatar.png'
          },
          hasUserInfo: true,
          userLevel: userInfo.level || 1,
          levelProgress: userInfo.levelProgress || 0,
          points: userInfo.points || 0
        })
        
        // 获取对话统计
        this.getDialogStats()
        
        // 更新AI心情
        this.updateAiMood()
      } else {
        // 如果API请求失败，回退到本地数据
        this.getUserInfoLocal()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 失败时使用本地数据
      this.getUserInfoLocal()
    }
  },
  
  /**
   * 从服务器获取任务信息
   */
  async getTasksFromServer() {
    try {
      const res = await request({
        url: '/api/tasks',
        method: 'GET'
      })
      
      if (res && res.data && res.data.success) {
        const serverTasks = res.data.data
        
        // 转换任务数据格式以匹配前端显示需求
        const tasks = serverTasks.map(task => ({
          id: task._id,
          name: task.name,
          desc: task.description,
          reward: task.rewardPoints,
          progress: task.progress,
          max: task.target,
          completed: task.completed
        }))
        
        // 更新任务状态
        this.setData({ 
          tasks,
          dailyTaskCompleted: tasks.find(t => t.name === '每日对话')?.completed || false,
          dailyDialogCount: tasks.find(t => t.name === '每日对话')?.progress || 0
        })
      } else {
        // API请求失败，回退到本地任务数据
        this.updateTaskStatus()
      }
    } catch (error) {
      console.error('获取任务信息失败:', error)
      // 失败时使用本地数据
      this.updateTaskStatus()
    }
  },
  
  /**
   * 获取对话统计数据
   */
  async getDialogStats() {
    try {
      const res = await request({
        url: '/api/chat/stats',
        method: 'GET'
      })
      
      if (res && res.data && res.data.success) {
        const stats = res.data.data
        
        this.setData({
          dialogStats: {
            total: stats.totalCount || 0,
            likes: stats.likeCount || 0,
            solved: stats.solvedCount || 0
          },
          newHistoryCount: stats.newCount || 0
        })
      } else {
        // 使用本地数据
        const dialogData = wx.getStorageSync('dialogData') || { 
          total: 128, 
          likes: 32, 
          solved: 86,
          newCount: 3
        }
        
        this.setData({
          dialogStats: {
            total: dialogData.total || 0,
            likes: dialogData.likes || 0,
            solved: dialogData.solved || 0
          },
          newHistoryCount: dialogData.newCount || 0
        })
      }
    } catch (error) {
      console.error('获取对话统计失败:', error)
      // 失败时使用本地数据
      const dialogData = wx.getStorageSync('dialogData') || { 
        total: 128, 
        likes: 32, 
        solved: 86,
        newCount: 3
      }
      
      this.setData({
        dialogStats: {
          total: dialogData.total || 0,
          likes: dialogData.likes || 0,
          solved: dialogData.solved || 0
        },
        newHistoryCount: dialogData.newCount || 0
      })
    }
  },
})