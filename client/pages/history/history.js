import { getHistoryList, deleteHistory, searchHistory } from '../../api/history'
import { formatTime } from '../../utils/util'

Page({
  data: {
    historyList: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    keyword: '',
    showActionSheet: false,
    currentHistory: null,
    stats: {
      total: 0,
      today: 0
    }
  },

  onLoad() {
    this.loadHistoryList()
  },

  // 加载历史记录列表
  async loadHistoryList(refresh = false) {
    if (this.data.loading) return

    const { page, pageSize, keyword, historyList } = this.data
    
    if (refresh) {
      this.setData({ 
        page: 1,
        historyList: [],
        hasMore: true
      })
    }

    this.setData({ loading: true })

    try {
      const params = {
        page: refresh ? 1 : page,
        pageSize,
        keyword
      }

      const res = await getHistoryList(params)
      
      const formattedList = res.data.list.map(item => {
        const date = new Date(item.createdAt);
        return {
          ...item,
          formattedTime: formatTime(date)
        };
      })

      this.setData({
        historyList: refresh ? formattedList : [...historyList, ...formattedList],
        hasMore: formattedList.length === pageSize,
        page: refresh ? 2 : page + 1,
        stats: res.data.stats
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 搜索
  handleSearch(e) {
    const { value } = e.detail
    this.setData({ keyword: value }, () => {
      this.loadHistoryList(true)
    })
  },

  // 显示操作菜单
  handleShowAction(e) {
    const { history } = e.currentTarget.dataset
    this.setData({
      showActionSheet: true,
      currentHistory: history
    })
  },

  // 隐藏操作菜单
  handleHideAction() {
    this.setData({
      showActionSheet: false,
      currentHistory: null
    })
  },

  // 删除历史记录
  async handleDelete() {
    const { currentHistory } = this.data
    if (!currentHistory) return

    try {
      await deleteHistory(currentHistory._id)
      
      // 更新列表
      const historyList = this.data.historyList.filter(
        item => item._id !== currentHistory._id
      )
      
      this.setData({ historyList })

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      })
    } finally {
      this.handleHideAction()
    }
  },

  // 查看详情
  handleViewDetail(e) {
    const { history } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/history/detail/detail?id=${history._id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistoryList(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadHistoryList()
    }
  }
}) 