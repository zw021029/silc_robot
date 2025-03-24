import { getUserInfo, updateUserInfo } from '../../api/user'

Page({
  data: {
    userInfo: null,
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      this.setData({ loading: true })
      const res = await getUserInfo()
      this.setData({ userInfo: res })
    } catch (error) {
      wx.showToast({
        title: error.message || '获取用户信息失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 修改用户信息
  async handleUpdateInfo() {
    try {
      await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      const res = await updateUserInfo({
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender
      })

      this.setData({
        userInfo: res
      })

      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })

    } catch (error) {
      if (error.errMsg !== 'getUserProfile:fail auth deny') {
        wx.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      }
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          const app = getApp()
          app.globalData.userInfo = null
          app.globalData.selectedRobot = null
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
}) 