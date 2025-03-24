import { bindRobot } from '../../api/user'

Page({
  data: {
    robots: [
      {
        id: 1,
        name: '悉文',
        avatar: '/assets/images/robot-male.png',
        desc: '专业、理性的男性机器人助手'
      },
      {
        id: 2,
        name: '悉荟',
        avatar: '/assets/images/robot-female.png',
        desc: '温柔、感性的女性机器人助手'
      }
    ],
    selectedRobot: null,
    loading: false,
    initialized: false
  },

  onLoad() {
    this.initPage()
  },

  async initPage() {
    const app = getApp()
    
    if (app.globalData.isCheckingLogin) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      
      const checkInterval = setInterval(() => {
        if (!app.globalData.isCheckingLogin) {
          clearInterval(checkInterval)
          wx.hideLoading()
          this.checkLoginAndInit()
        }
      }, 100)
    } else {
      this.checkLoginAndInit()
    }
  },

  checkLoginAndInit() {
    const app = getApp()
    
    if (!app.globalData.userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      selectedRobot: app.globalData.selectedRobot,
      initialized: true
    })
  },

  onShow() {
    if (this.data.initialized) {
      this.checkLoginAndInit()
    }
  },

  async handleSelectRobot(e) {
    if (this.data.loading) return
    
    const robotId = parseInt(e.currentTarget.dataset.robotId)
    if (!robotId) {
      wx.showToast({
        title: '无效的机器人ID',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await bindRobot(robotId)
      
      const robot = this.data.robots.find(r => r.id === robotId)
      if (!robot) {
        throw new Error('未找到对应的机器人')
      }

      const app = getApp()
      app.globalData.selectedRobot = robot

      this.setData({ selectedRobot: robot })

      wx.showToast({
        title: '切换成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/chat/chat'
        })
      }, 1000)

    } catch (error) {
      wx.showToast({
        title: error.message || '切换失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 