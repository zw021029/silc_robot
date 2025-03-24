import { getRobotList, bindRobot } from '../../api/robot'

Page({
  data: {
    robots: [
      {
        id: 1,
        name: '悉文',
        avatar: '/assets/images/xiwen.png',
        description: '专业、稳重的男性机器人助手',
        personality: 'male'
      },
      {
        id: 2,
        name: '悉荟',
        avatar: '/assets/images/xihui.png',
        description: '温柔、贴心的女性机器人助手',
        personality: 'female'
      }
    ],
    selectedRobot: null,
    loading: false
  },

  onLoad() {
    this.loadRobots()
  },

  // 加载机器人列表
  async loadRobots() {
    try {
      this.setData({ loading: true })
      const res = await getRobotList()
      this.setData({ robots: res.data })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 选择机器人
  handleSelect(e) {
    const { robot } = e.currentTarget.dataset
    this.setData({ selectedRobot: robot })
  },

  // 绑定机器人
  async handleBind() {
    const { selectedRobot } = this.data
    if (!selectedRobot) {
      wx.showToast({
        title: '请先选择机器人',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      await bindRobot(selectedRobot.id)
      
      // 更新全局数据
      const app = getApp()
      app.globalData.selectedRobot = selectedRobot

      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      // 延迟跳转到聊天页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/chat/chat'
        })
      }, 1500)
    } catch (error) {
      wx.showToast({
        title: error.message || '绑定失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 