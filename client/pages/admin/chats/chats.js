import { getChatList } from '../../../api/admin'

Page({
  data: {
    chatList: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    searchKey: '',
    robotTypes: [
      { id: 0, name: '全部类型' },
      { id: 1, name: 'GPT对话' },
      { id: 2, name: '知识库对话' }
    ],
    robotTypeIndex: 0,
    dateFilter: ''
  },

  onLoad() {
    this.loadChatList()
  },

  // 加载对话列表
  async loadChatList(isRefresh = false) {
    if (this.data.loading) return

    const { page, pageSize, searchKey, robotTypes, robotTypeIndex, dateFilter, chatList } = this.data

    if (isRefresh) {
      this.setData({ page: 1, chatList: [] })
    }

    this.setData({ loading: true })

    try {
      const res = await getChatList({
        page: isRefresh ? 1 : page,
        pageSize,
        keyword: searchKey,
        robotType: robotTypes[robotTypeIndex].id || null,
        date: dateFilter || null
      })

      const newList = isRefresh ? res.data.list : [...chatList, ...res.data.list]
      
      this.setData({
        chatList: newList,
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
    this.loadChatList(true)
  }, 500),

  // 机器人类型切换
  handleRobotTypeChange(e) {
    this.setData({
      robotTypeIndex: parseInt(e.detail.value)
    })
    this.loadChatList(true)
  },

  // 日期筛选
  handleDateChange(e) {
    this.setData({
      dateFilter: e.detail.value
    })
    this.loadChatList(true)
  },

  // 查看对话详情
  showChatDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/chats/detail/detail?id=${id}`
    })
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadChatList()
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadChatList(true)
    wx.stopPullDownRefresh()
  }
}) 