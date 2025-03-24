import { getKnowledgeQueries } from '../../../../api/admin'

Page({
  data: {
    fileId: '',
    queryList: [],
    stats: {},
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    searchKey: '',
    accuracyRanges: [
      { id: 0, name: '全部相关度', min: 0 },
      { id: 1, name: '高相关(≥80%)', min: 80 },
      { id: 2, name: '中相关(≥60%)', min: 60 },
      { id: 3, name: '低相关(<60%)', min: 0, max: 60 }
    ],
    accuracyIndex: 0,
    dateFilter: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ fileId: options.id })
      this.loadQueryList()
    } else {
      wx.showToast({
        title: '文件ID不存在',
        icon: 'none'
      })
      this.goBack()
    }
  },

  // 加载调用记录
  async loadQueryList(isRefresh = false) {
    if (this.data.loading) return

    const { 
      page, 
      pageSize, 
      searchKey, 
      accuracyRanges, 
      accuracyIndex, 
      dateFilter, 
      queryList,
      fileId 
    } = this.data

    if (isRefresh) {
      this.setData({ page: 1, queryList: [] })
    }

    this.setData({ loading: true })

    try {
      const accuracyRange = accuracyRanges[accuracyIndex]
      const res = await getKnowledgeQueries({
        fileId,
        page: isRefresh ? 1 : page,
        pageSize,
        keyword: searchKey,
        minAccuracy: accuracyRange.min,
        maxAccuracy: accuracyRange.max,
        date: dateFilter
      })

      const newList = isRefresh ? res.data.list : [...queryList, ...res.data.list]
      
      this.setData({
        queryList: newList,
        stats: res.data.stats || {},
        hasMore: newList.length < res.data.total,
        page: isRefresh ? 2 : page + 1,
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

  // 搜索
  handleSearch: function(e) {
    this.setData({
      searchKey: e.detail.value
    })
    this.debounceSearch()
  },

  // 防抖搜索
  debounceSearch: wx.utils.debounce(function() {
    this.loadQueryList(true)
  }, 500),

  // 相关度筛选
  handleAccuracyChange(e) {
    this.setData({
      accuracyIndex: parseInt(e.detail.value)
    })
    this.loadQueryList(true)
  },

  // 日期筛选
  handleDateChange(e) {
    this.setData({
      dateFilter: e.detail.value
    })
    this.loadQueryList(true)
  },

  // 查看调用详情
  showQueryDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/knowledge/queries/detail/detail?id=${id}`
    })
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadQueryList()
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadQueryList(true)
    wx.stopPullDownRefresh()
  }
}) 