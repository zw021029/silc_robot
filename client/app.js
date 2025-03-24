App({
  globalData: {
    userInfo: null,
    selectedRobot: null,
    isAdmin: false
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 验证token有效性
    wx.request({
      url: 'https://silcrobot.willzuo.top/api/user/verify',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.globalData.userInfo = res.data.userInfo
          this.globalData.isAdmin = res.data.isAdmin
        } else {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      },
      fail: () => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    })
  }
}) 