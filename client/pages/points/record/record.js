import { getExchangeRecords } from '../../../api/points'

Page({
  data: {
    recordList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    showDetail: false,
    currentRecord: null
  },

  onLoad() {
    this.loadRecordList()
  },

  // 加载兑换记录
  async loadRecordList(isLoadMore = false) {
    if (this.data.loading) return

    try {
      this.setData({ loading: true })
      
      const { page, pageSize } = this.data
      const res = await getExchangeRecords({
        page: isLoadMore ? page + 1 : 1,
        pageSize
      })

      if (res.success) {
        const { list, total } = res.data
        const newList = isLoadMore ? [...this.data.recordList, ...list] : list
        
        this.setData({
          recordList: newList,
          page: isLoadMore ? page + 1 : 1,
          hasMore: newList.length < total
        })
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 显示记录详情
  showRecordDetail(e) {
    const { id } = e.currentTarget.dataset
    const record = this.data.recordList.find(item => item.id === id)
    
    if (record) {
      this.setData({
        showDetail: true,
        currentRecord: record
      })
    }
  },

  // 隐藏记录详情
  hideRecordDetail() {
    this.setData({
      showDetail: false
    })
  },

  // 取消兑换
  cancelExchange() {
    const { currentRecord } = this.data

    wx.showModal({
      title: '确认取消',
      content: '确定要取消该兑换记录吗？',
      success: res => {
        if (res.confirm) {
          // TODO: 调用取消兑换API
          wx.showLoading({ title: '取消中' })

          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '取消成功',
              icon: 'success'
            })

            // 更新记录列表
            const recordList = this.data.recordList.map(item => {
              if (item.id === currentRecord.id) {
                return {
                  ...item,
                  status: 'failed',
                  statusText: '已取消'
                }
              }
              return item
            })

            this.setData({
              recordList,
              showDetail: false
            })
          }, 1500)
        }
      }
    })
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList(true)
    }
  },

  // 阻止弹窗背景滚动
  preventTouchMove() {
    return false
  },

  // 阻止事件冒泡
  stopPropagation() {
    return false
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()

    return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute].map(this.formatNumber).join(':')
  },

  formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      recordList: []
    }, () => {
      this.loadRecordList()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList()
    }
  },

  // 隐藏详情
  hideDetail() {
    this.setData({
      showDetail: false,
      currentRecord: null
    })
  },

  // 加载更多
  loadMoreRecords() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList()
    }
  }
})