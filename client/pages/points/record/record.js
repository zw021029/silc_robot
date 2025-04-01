import { getPointsHistory } from '../../../api/points'

Page({
  data: {
    recordList: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    currentStatus: 'all',
    statusList: [
      { label: '成功', value: 'success' },
      { label: '处理中', value: 'pending' },
      { label: '失败', value: 'failed' }
    ],
    showDetail: false,
    currentRecord: null
  },

  onLoad() {
    this.loadRecordList()
  },

  // 切换状态筛选
  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    if (status === this.data.currentStatus) return
    
    this.setData({
      currentStatus: status,
      recordList: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadRecordList()
    })
  },

  // 加载兑换记录
  async loadRecordList(refresh = false) {
    if (this.data.loading) return

    const { page, pageSize, currentStatus } = this.data
    
    this.setData({ loading: true })
    wx.showNavigationBarLoading()

    try {
      const params = {
        page: refresh ? 1 : page,
        pageSize
      }

      // 如果不是全部，则添加状态筛选
      if (currentStatus !== 'all') {
        params.status = currentStatus
      }

      const res = await getPointsHistory(params)
      
      if (res.success) {
        // 格式化数据
        const formattedList = res.data.list.map(item => ({
          id: item.id,
          orderNo: item.orderNo || this.generateOrderNo(),
          goodsName: item.goodsName || '积分商品',
          goodsImage: item.goodsImage || '',
          points: item.points,
          createTime: this.formatTime(new Date(item.createdAt)),
          status: item.status,
          statusText: this.getStatusText(item.status),
          receiverName: item.receiverName,
          receiverPhone: item.receiverPhone,
          receiverAddress: item.receiverAddress,
          logistics: item.logistics
        }))

        this.setData({
          recordList: refresh ? formattedList : [...this.data.recordList, ...formattedList],
          hasMore: formattedList.length === pageSize,
          page: refresh ? 2 : page + 1
        })
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
      console.error('加载兑换记录失败:', error)
    } finally {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }
  },

  // 生成随机订单号
  generateOrderNo() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `E${year}${month}${day}${random}`
  },

  // 获取状态文本
  getStatusText(status) {
    switch (status) {
      case 'success': return '兑换成功'
      case 'pending': return '处理中'
      case 'failed': return '兑换失败'
      default: return '未知状态'
    }
  },

  // 显示记录详情
  showRecordDetail(e) {
    const id = e.currentTarget.dataset.id
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
      this.loadRecordList()
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
  }
}) 