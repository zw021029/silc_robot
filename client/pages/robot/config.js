import { getRobotConfig, updateRobotConfig } from '../../api/chat'

Page({
  data: {
    config: null,
    loading: false,
    saving: false
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
    this.loadConfig()
  },

  async loadConfig() {
    try {
      this.setData({ loading: true })
      const app = getApp()
      const robotId = app.globalData.selectedRobot.id
      const res = await getRobotConfig(robotId)
      this.setData({ config: res })
    } catch (error) {
      wx.showToast({
        title: error.message || '获取配置失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 更新配置
  async handleSave() {
    try {
      this.setData({ saving: true })
      const app = getApp()
      const robotId = app.globalData.selectedRobot.id
      await updateRobotConfig(robotId, this.data.config)
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 开关切换
  handleSwitchChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`config.${field}`]: e.detail.value
    })
  },

  // 输入框变化
  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`config.${field}`]: e.detail.value
    })
  }
}) 