App({
  globalData: {
    userInfo: null,
    selectedRobot: null,
    isAdmin: false,
    isCheckingLogin: true
  },

  onLaunch() {
    console.log('App onLaunch')
    // 检查登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    console.log('Checking login status...')
    const token = wx.getStorageSync('token')
    console.log('Token from storage:', token)
    
    if (!token) {
      console.log('No token found, redirecting to login')
      this.globalData.isCheckingLogin = false
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 验证token有效性
    console.log('Sending verify request...')
    const BASE_URL = 'http://localhost:3005';
    wx.request({
      url: `${BASE_URL}/verify`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('Verify response:', res)
        if (res.statusCode === 200) {
          // 先设置globalData
          this.globalData.userInfo = res.data.data
          this.globalData.isAdmin = res.data.isAdmin
          this.globalData.isCheckingLogin = false

          // 保存到本地存储
          wx.setStorageSync('userInfo', res.data.data)
          wx.setStorageSync('isAdmin', res.data.isAdmin)
          
          // 检查是否已选择机器人
          const selectedRobot = wx.getStorageSync('selectedRobot')
          console.log('Selected robot from storage:', selectedRobot)
          
          if (selectedRobot) {
            console.log('Robot already selected, switching to chat')
            this.globalData.selectedRobot = selectedRobot
            // 如果已选择机器人，跳转到聊天页面
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/chat/chat',
                success: () => {
                  console.log('Successfully switched to chat page')
                },
                fail: (err) => {
                  console.error('Failed to switch to chat page:', err)
                }
              })
            }, 100)
          } else {
            console.log('No robot selected, launching index page')
            // 如果未选择机器人，跳转到选择页面
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index',
                success: () => {
                  console.log('Successfully launched index page')
                },
                fail: (err) => {
                  console.error('Failed to launch index page:', err)
                }
              })
            }, 100)
          }
        } else {
          console.log('Token verification failed, redirecting to login')
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('isAdmin')
          wx.removeStorageSync('selectedRobot')
          this.globalData.isCheckingLogin = false
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      },
      fail: (err) => {
        console.error('Verify request failed:', err)
        wx.removeStorageSync('token')
        wx.removeStorageSync('userInfo')
        wx.removeStorageSync('isAdmin')
        wx.removeStorageSync('selectedRobot')
        this.globalData.isCheckingLogin = false
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
  }
}) 