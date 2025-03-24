import { getUserList, updateUserStatus } from '../../../api/admin'

Page({
  data: {
    userList: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    searchKey: ''
  },

  onLoad() {
    this.loadUserList()
  },

  // 加载用户列表
  async loadUserList(isRefresh = false) {
    if (this.data.loading) return

    const { page, pageSize, searchKey, userList } = this.data

    if (isRefresh) {
      this.setData({ page: 1, userList: [] })
    }

    this.setData({ loading: true })

    try {
      const res = await getUserList({
        page: isRefresh ? 1 : page,
        pageSize,
        keyword: searchKey
      })

      const newList = isRefresh ? res.data.list : [...userList, ...res.data.list]
      
      this.setData({
        userList: newList,
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
    this.loadUserList(true)
  }, 500),

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadUserList()
  },

  // 查看用户详情
  showUserDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/users/detail/detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserList(true)
    wx.stopPullDownRefresh()
  },

  // 触底加载
  onReachBottom() {
    this.loadMore()
  }
}) 