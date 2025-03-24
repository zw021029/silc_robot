import {
  getUserStats,
  getChatStats,
  getRobotStats,
  getEvaluationStats,
  getPointsStats,
  getSystemStats,
  exportStats
} from '../../../api/stats'

Page({
  data: {
    activeTab: 'overview', // overview, chat, robot, evaluation, points
    dateRange: 'week', // week, month, year, custom
    customStart: '',
    customEnd: '',
    loading: false,
    stats: {
      overview: null,
      chat: null,
      robot: null,
      evaluation: null,
      points: null
    },
    chartWidth: 300,
    chartHeight: 200,
    touchStartX: 0,
    touchStartY: 0,
    activePointIndex: -1,
    tooltipVisible: false,
    tooltipData: null,
    refreshTimer: null,
    autoRefreshInterval: 5 * 60 * 1000 // 5分钟自动刷新
  },

  onLoad() {
    // 检查用户权限
    const app = getApp()
    const userInfo = app.globalData.userInfo

    if (!userInfo || !userInfo.isAdmin) {
      wx.showModal({
        title: '提示',
        content: '暂无访问权限',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return
    }

    // 获取系统信息设置图表尺寸
    const systemInfo = wx.getSystemInfoSync()
    const chartWidth = systemInfo.windowWidth - 40
    this.setData({
      chartWidth,
      chartHeight: chartWidth * 0.6
    })

    this.loadStats()
    this.startAutoRefresh()
  },

  onShow() {
    this.startAutoRefresh()
  },

  onHide() {
    this.stopAutoRefresh()
  },

  onUnload() {
    this.stopAutoRefresh()
  },

  // 监听屏幕旋转
  onResize(res) {
    const { windowWidth } = res.size
    const chartWidth = windowWidth - 40
    this.setData({
      chartWidth,
      chartHeight: chartWidth * 0.6
    })
    this.loadStats() // 重新绘制图表
  },

  // 切换标签
  handleTabChange(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ activeTab: tab })
    this.loadStats()
  },

  // 切换时间范围
  handleRangeChange(e) {
    this.setData({ 
      dateRange: e.detail.value,
      customStart: '',
      customEnd: ''
    })
    this.loadStats()
  },

  // 选择自定义时间范围
  handleDateChange(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      [type]: e.detail.value
    })
    if (this.data.customStart && this.data.customEnd) {
      this.loadStats()
    }
  },

  // 加载统计数据
  async loadStats() {
    const { activeTab, dateRange, customStart, customEnd } = this.data
    
    try {
      // 尝试从缓存获取数据
      const cacheKey = `stats_${activeTab}_${dateRange}_${customStart}_${customEnd}`
      const cache = wx.getStorageSync(cacheKey)
      
      if (cache && Date.now() - cache.timestamp < 5 * 60 * 1000) {
        this.setData({
          [`stats.${activeTab}`]: cache.data
        })
        this.drawCharts()
        return
      }

      this.setData({ loading: true })

      const params = {
        range: dateRange,
        startDate: customStart,
        endDate: customEnd
      }

      let res
      switch (activeTab) {
        case 'overview':
          res = await getSystemStats()
          break
        case 'chat':
          res = await getChatStats(params)
          break
        case 'robot':
          res = await getRobotStats()
          break
        case 'evaluation':
          res = await getEvaluationStats(params)
          break
        case 'points':
          res = await getPointsStats()
          break
      }

      // 保存到缓存
      wx.setStorageSync(cacheKey, {
        data: res,
        timestamp: Date.now()
      })

      this.setData({
        [`stats.${activeTab}`]: res
      })

      this.drawCharts()

    } catch (error) {
      console.error('加载统计数据失败:', error)
      wx.showToast({
        title: error.message || '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 绘制所有相关图表
  drawCharts() {
    const { activeTab } = this.data
    switch (activeTab) {
      case 'chat':
        this.drawChatTrend()
        break
      case 'robot':
        this.drawRobotUsage()
        break
      case 'evaluation':
        this.drawEvaluationDist()
        break
      case 'points':
        this.drawPointsTrend()
        this.drawPointsUsage()
        break
    }
  },

  // 绘制对话趋势图
  drawChatTrend() {
    const { stats } = this.data
    if (!stats.chat?.trend) return

    const ctx = wx.createCanvasContext('chatTrend')
    const width = 300 // 需要根据实际屏幕宽度调整
    const height = 200
    const padding = 30

    // 绘制坐标轴
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(padding, padding)
    ctx.setStrokeStyle('#999')
    ctx.stroke()

    // 绘制对话数量折线
    const chatData = stats.chat.trend.chatCount
    const maxChat = Math.max(...chatData)
    const chatPoints = chatData.map((count, index) => ({
      x: padding + (width - 2 * padding) * (index / (chatData.length - 1)),
      y: height - padding - (height - 2 * padding) * (count / maxChat)
    }))

    ctx.beginPath()
    ctx.moveTo(chatPoints[0].x, chatPoints[0].y)
    chatPoints.forEach(point => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.setStrokeStyle('#1296db')
    ctx.stroke()

    // 绘制活跃用户折线
    const userData = stats.chat.trend.activeUsers
    const maxUser = Math.max(...userData)
    const userPoints = userData.map((count, index) => ({
      x: padding + (width - 2 * padding) * (index / (userData.length - 1)),
      y: height - padding - (height - 2 * padding) * (count / maxUser)
    }))

    ctx.beginPath()
    ctx.moveTo(userPoints[0].x, userPoints[0].y)
    userPoints.forEach(point => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.setStrokeStyle('#91d5ff')
    ctx.stroke()

    ctx.draw()
  },

  // 绘制机器人使用情况饼图
  drawRobotUsage() {
    const { stats } = this.data
    if (!stats.robot?.usage) return

    const ctx = wx.createCanvasContext('robotUsage')
    const centerX = 150 // 需要根据实际屏幕宽度调整
    const centerY = 150
    const radius = 100

    let startAngle = 0
    stats.robot.usage.forEach(item => {
      const endAngle = startAngle + (item.value / 100) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.setFillStyle(item.color)
      ctx.fill()

      startAngle = endAngle
    })

    ctx.draw()
  },

  // 绘制评价分布柱状图
  drawEvaluationDist() {
    const { stats } = this.data
    if (!stats.evaluation?.distribution) return

    const ctx = wx.createCanvasContext('evaluationDist')
    const width = 300 // 需要根据实际屏幕宽度调整
    const height = 200
    const padding = 30

    const data = stats.evaluation.distribution
    const maxValue = Math.max(...Object.values(data))
    const barWidth = (width - 2 * padding) / Object.keys(data).length / 2

    let index = 0
    for (const [key, value] of Object.entries(data)) {
      const x = padding + (width - 2 * padding) * (index / (Object.keys(data).length - 1))
      const barHeight = (height - 2 * padding) * (value / maxValue)

      ctx.beginPath()
      ctx.rect(x - barWidth / 2, height - padding - barHeight, barWidth, barHeight)
      ctx.setFillStyle('#1296db')
      ctx.fill()

      index++
    }

    ctx.draw()
  },

  // 绘制积分趋势图
  drawPointsTrend() {
    const { stats, chartWidth = 300, chartHeight = 200 } = this.data
    if (!stats.points?.trend) return

    const ctx = wx.createCanvasContext('pointsTrend')
    const padding = 30

    // 绘制坐标轴
    ctx.beginPath()
    ctx.moveTo(padding, chartHeight - padding)
    ctx.lineTo(chartWidth - padding, chartHeight - padding)
    ctx.moveTo(padding, chartHeight - padding)
    ctx.lineTo(padding, padding)
    ctx.setStrokeStyle('#999')
    ctx.stroke()

    // 绘制积分趋势线
    const pointsData = stats.points.trend.points
    const maxPoints = Math.max(...pointsData)
    const points = pointsData.map((value, index) => ({
      x: padding + (chartWidth - 2 * padding) * (index / (pointsData.length - 1)),
      y: chartHeight - padding - (chartHeight - 2 * padding) * (value / maxPoints)
    }))

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight)
    gradient.addColorStop(0, 'rgba(18, 150, 219, 0.1)')
    gradient.addColorStop(1, 'rgba(18, 150, 219, 0)')

    ctx.beginPath()
    ctx.moveTo(points[0].x, chartHeight - padding)
    points.forEach(point => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, chartHeight - padding)
    ctx.closePath()
    ctx.setFillStyle(gradient)
    ctx.fill()

    // 绘制趋势线
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach(point => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.setStrokeStyle('#1296db')
    ctx.stroke()

    // 绘制数据点
    points.forEach(point => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
      ctx.setFillStyle('#fff')
      ctx.setStrokeStyle('#1296db')
      ctx.stroke()
      ctx.fill()
    })

    // 绘制X轴标签
    const dates = stats.points.trend.dates
    const step = Math.floor(dates.length / 5)
    dates.forEach((date, index) => {
      if (index % step === 0) {
        const x = padding + (chartWidth - 2 * padding) * (index / (dates.length - 1))
        ctx.setFontSize(10)
        ctx.setTextAlign('center')
        ctx.setFillStyle('#999')
        ctx.fillText(date, x, chartHeight - padding + 15)
      }
    })

    ctx.draw()
  },

  // 绘制积分使用分布图
  drawPointsUsage() {
    const { stats, chartWidth = 300 } = this.data
    if (!stats.points?.usage) return

    const ctx = wx.createCanvasContext('pointsUsage')
    const centerX = chartWidth / 2
    const centerY = chartWidth / 2
    const radius = chartWidth / 3

    let startAngle = 0
    stats.points.usage.forEach(item => {
      const endAngle = startAngle + (item.value / 100) * 2 * Math.PI

      // 绘制扇形
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.setFillStyle(item.color)
      ctx.fill()

      // 绘制标签线和文字
      const midAngle = startAngle + (endAngle - startAngle) / 2
      const labelRadius = radius * 1.2
      const labelX = centerX + Math.cos(midAngle) * labelRadius
      const labelY = centerY + Math.sin(midAngle) * labelRadius

      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
      ctx.lineTo(labelX, labelY)
      ctx.setStrokeStyle('#999')
      ctx.stroke()

      ctx.setFontSize(12)
      ctx.setTextAlign(labelX > centerX ? 'left' : 'right')
      ctx.setFillStyle('#333')
      ctx.fillText(`${item.type} ${item.value}%`, labelX + (labelX > centerX ? 5 : -5), labelY)

      startAngle = endAngle
    })

    ctx.draw()
  },

  // 导出统计数据
  async handleExport() {
    try {
      const { activeTab, dateRange, customStart, customEnd } = this.data

      wx.showLoading({
        title: '导出中...'
      })

      const res = await exportStats({
        type: activeTab,
        range: dateRange,
        startDate: customStart,
        endDate: customEnd
      })

      const filePath = res.tempFilePath
      await wx.saveFile({
        tempFilePath: filePath
      })

      wx.showToast({
        title: '导出成功',
        icon: 'success'
      })

    } catch (error) {
      wx.showToast({
        title: error.message || '导出失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 触摸开始
  handleTouchStart(e) {
    const { x, y } = e.touches[0]
    this.setData({
      touchStartX: x,
      touchStartY: y
    })
    this.findActivePoint(x, y)
  },

  // 触摸移动
  handleTouchMove(e) {
    const { x, y } = e.touches[0]
    this.findActivePoint(x, y)
  },

  // 触摸结束
  handleTouchEnd() {
    this.setData({ 
      activePointIndex: -1,
      tooltipVisible: false,
      tooltipData: null
    })
  },

  // 查找触摸点附近的数据点
  findActivePoint(x, y) {
    const { chartWidth, chartHeight, stats, activeTab } = this.data
    const padding = 30
    const threshold = 20

    let points = []
    if (activeTab === 'chat' && stats.chat?.trend) {
      points = stats.chat.trend.chatCount.map((value, index) => ({
        x: padding + (chartWidth - 2 * padding) * (index / (stats.chat.trend.chatCount.length - 1)),
        y: chartHeight - padding - (chartHeight - 2 * padding) * (value / Math.max(...stats.chat.trend.chatCount)),
        value,
        date: stats.chat.trend.dates[index]
      }))
    } else if (activeTab === 'points' && stats.points?.trend) {
      points = stats.points.trend.points.map((value, index) => ({
        x: padding + (chartWidth - 2 * padding) * (index / (stats.points.trend.points.length - 1)),
        y: chartHeight - padding - (chartHeight - 2 * padding) * (value / Math.max(...stats.points.trend.points)),
        value,
        date: stats.points.trend.dates[index]
      }))
    }

    const activePoint = points.findIndex(point => {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
      return distance < threshold
    })

    if (activePoint !== this.data.activePointIndex) {
      this.setData({ 
        activePointIndex: activePoint,
        tooltipVisible: activePoint !== -1,
        tooltipData: activePoint !== -1 ? points[activePoint] : null
      })
      this.redrawChart()
    }
  },

  // 重绘当前图表
  redrawChart() {
    const { activeTab } = this.data
    switch (activeTab) {
      case 'chat':
        this.drawChatTrend()
        break
      case 'points':
        this.drawPointsTrend()
        break
    }
  },

  // 显示数据提示
  showTooltip(point) {
    wx.showToast({
      title: `数值：${point.value}`,
      icon: 'none',
      duration: 1500
    })
  },

  // 开启自动刷新
  startAutoRefresh() {
    this.stopAutoRefresh()
    this.data.refreshTimer = setInterval(() => {
      this.loadStats()
    }, this.data.autoRefreshInterval)
  },

  // 停止自动刷新
  stopAutoRefresh() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer)
      this.data.refreshTimer = null
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      await this.loadStats()
    } finally {
      wx.stopPullDownRefresh()
    }
  }
}) 