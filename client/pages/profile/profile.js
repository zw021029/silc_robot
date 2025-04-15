// pages/profile/profile.js
import request from '../../utils/request'
import { getUserInfo, updateUserInfo } from '../../api/user'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: false,
    points: 0,
    notifications: [],
    showNotificationBadge: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      // 已登录，获取用户信息
      this.getUserInfoFromServer()
      this.getNotifications()
    } else {
      // 未登录，提示用户登录
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfoFromServer() {
    try {
      wx.showLoading({
        title: '加载中...'
      })
      
      const res = await getUserInfo()
      
      // 检查响应格式
      if (res.success === false || res.code === 401) {
        wx.hideLoading()
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        })
        return
      }
      
      // 处理不同的响应格式
      let userData = res
      if (res.data) {
        userData = res.data
      } else if (typeof res === 'object' && res._id) {
        userData = res
      }
      
      this.setData({
        userInfo: userData,
        hasUserInfo: true,
        points: userData.points || 0
      })
      
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    }
  },

  /**
   * 获取通知消息
   */
  async getNotifications() {
    try {
      // 这里可以实现获取通知的逻辑
      // 暂时使用模拟数据
      const notifications = [
        { id: 1, title: '系统通知', content: '欢迎使用SILC智能助手', time: '刚刚', read: false },
        { id: 2, title: '更新提示', content: '系统已更新到最新版本', time: '昨天', read: true }
      ]
      
      this.setData({
        notifications: notifications,
        showNotificationBadge: notifications.some(item => !item.read)
      })
    } catch (error) {
      console.error('获取通知失败:', error)
    }
  },

  /**
   * 读取所有通知
   */
  readAllNotifications() {
    // 标记所有通知为已读
    const updatedNotifications = this.data.notifications.map(item => {
      return { ...item, read: true }
    })
    
    this.setData({
      notifications: updatedNotifications,
      showNotificationBadge: false
    })
    
    // 跳转到通知页面
    wx.navigateTo({
      url: '/pages/notifications/notifications'
    })
  },

  /**
   * 跳转到个人信息设置页面
   */
  goToUserInfo() {
    wx.navigateTo({
      url: '/pages/user/info/info'
    })
  },

  /**
   * 跳转到意见反馈页面
   */
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },
  
  /**
   * 跳转到关于我们页面
   */
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (wx.getStorageSync('token')) {
      this.getUserInfoFromServer()
      this.getNotifications()
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新
    if (wx.getStorageSync('token')) {
      this.getUserInfoFromServer()
      this.getNotifications()
    }
    wx.stopPullDownRefresh()
  }
})