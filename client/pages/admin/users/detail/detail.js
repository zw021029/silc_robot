import { getUserDetail, updateUserStatus } from '../../../../api/admin'

Page({
  data: {
    userId: '',
    userInfo: {},
    recentChats: [],
    pointsRecords: [],
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ userId: options.id })
      this.loadUserDetail()
    } else {
      wx.showToast({
        title: '用户ID不存在',
        icon: 'none'
      })
      this.goBack()
    }
  },

  // 加载用户详情
  async loadUserDetail() {
    const { userId } = this.data
    
    try {
      const res = await getUserDetail(userId)
      this.setData({
        userInfo: res.data.userInfo,
        recentChats: res.data.recentChats || [],
        pointsRecords: res.data.pointsRecords || [],
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

  // 更新用户状态
  async handleStatusChange(e) {
    const { userId, userInfo } = this.data
    const newStatus = e.detail.value ? 1 : 0

    try {
      await wx.showModal({
        title: '提示',
        content: `确定要${newStatus === 1 ? '启用' : '禁用'}该用户吗？`,
        confirmText: '确定',
        cancelText: '取消'
      })

      await updateUserStatus(userId, newStatus)
      
      this.setData({
        'userInfo.status': newStatus
      })

      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })

    } catch (error) {
      if (error.errMsg !== 'showModal:fail cancel') {
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      }
      // 恢复开关状态
      this.setData({
        'userInfo.status': userInfo.status
      })
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserDetail()
    wx.stopPullDownRefresh()
  }
}) 