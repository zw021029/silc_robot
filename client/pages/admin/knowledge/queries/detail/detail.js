import { getQueryDetail } from '../../../../../api/admin'

Page({
  data: {
    queryId: '',
    queryDetail: {},
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ queryId: options.id })
      this.loadQueryDetail()
    } else {
      wx.showToast({
        title: '记录ID不存在',
        icon: 'none'
      })
      this.goBack()
    }
  },

  // 加载调用详情
  async loadQueryDetail() {
    const { queryId } = this.data
    
    try {
      const res = await getQueryDetail(queryId)
      this.setData({
        queryDetail: res.data,
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
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadQueryDetail()
    wx.stopPullDownRefresh()
  }
}) 