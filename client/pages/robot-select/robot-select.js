const { getRobotList, bindRobot } = require('../../api/robot')

Page({
  data: {
    robots: [
      {
        _id: 'xiwen',
        name: '悉文',
        avatar: '/assets/images/logo.png',
        description: '专业、稳重的男性机器人助手',
        personality: 'male'
      },
      {
        _id: 'xihui',
        name: '悉荟',
        avatar: '/assets/images/logo.png',
        description: '温柔、贴心的女性机器人助手',
        personality: 'female'
      }
    ],
    selectedRobot: null,
    loading: false
  },

  onLoad() {
    // 验证token
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }, 1500)
      return
    }
    
    this.loadRobots()
  },

  // 加载机器人列表
  async loadRobots() {
    try {
      this.setData({ loading: true })
      const res = await getRobotList()
      console.log('获取到的机器人列表:', res.data)
      
      // 确保返回的机器人列表中每个机器人都有_id字段
      const robots = res.data.map(robot => ({
        ...robot,
        _id: robot._id || robot.id // 兼容处理，如果没有_id就使用id
      }))
      
      this.setData({ robots })
    } catch (error) {
      console.error('加载机器人列表失败:', error)
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
    console.log('选择的机器人:', robot)
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
      
      // 确保使用正确的robotId
      const robotId = selectedRobot._id || selectedRobot.id // 兼容处理，如果没有_id就使用id
      console.log('绑定机器人，ID:', robotId)
      
      if (!robotId) {
        throw new Error('无效的机器人ID')
      }
      
      const res = await bindRobot(robotId)
      console.log('绑定结果:', res)
      
      // 更新全局数据
      const app = getApp()
      app.globalData.selectedRobot = selectedRobot
      wx.setStorageSync('selectedRobot', selectedRobot)

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
      console.error('绑定失败:', error)
      wx.showToast({
        title: error.message || '绑定失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 