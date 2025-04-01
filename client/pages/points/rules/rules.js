import { getPointsRules } from '../../../api/points'

Page({
  data: {
    rules: [],
    loading: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '积分规则'
    })
    this.loadRules()
  },

  // 加载积分规则
  async loadRules() {
    this.setData({ loading: true })
    wx.showNavigationBarLoading()
    
    try {
      const res = await getPointsRules()
      if (res.success) {
        // 格式化规则数据，确保有默认值
        const formattedRules = res.data.map(rule => ({
          id: rule.id || Date.now() + Math.random(),
          title: rule.title || '未命名规则',
          description: rule.description || '暂无描述',
          points: rule.points || 0
        }))
        
        this.setData({ rules: formattedRules })
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      console.error('加载积分规则失败:', error)
    } finally {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRules()
  },
  
  // 分享功能
  onShareAppMessage() {
    return {
      title: '了解积分规则，赚取更多积分！',
      path: '/pages/points/rules/rules'
    }
  }
}) 