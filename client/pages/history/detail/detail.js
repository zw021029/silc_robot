import { getHistoryDetail } from '../../../api/history'

Page({
  data: {
    historyDetail: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options
    this.loadHistoryDetail(id)
  },

  // 加载历史记录详情
  async loadHistoryDetail(id) {
    try {
      const res = await getHistoryDetail(id)
      this.setData({
        historyDetail: res.data,
        loading: false
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack()
  },

  // 分享
  onShareAppMessage() {
    const { historyDetail } = this.data
    return {
      title: '查看我的AI对话',
      path: `/pages/history/detail/detail?id=${historyDetail._id}`,
      imageUrl: '/assets/images/share-default.png'
    }
  }
}) 