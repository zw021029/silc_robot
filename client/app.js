App({
  globalData: {
    userInfo: null,
    userId: null,
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
    console.log('Token from storage:', token ? '存在' : '不存在')
    
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
    const BASE_URL = 'http://127.0.0.1:3005';
    wx.request({
      url: `${BASE_URL}/api/user/verify`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('Verify response:', res.data)
        if (res.statusCode === 200 && (res.data.code === 0 || res.data.success === true)) {
          console.log('Token验证成功，用户已登录')
          // 提取用户数据
          let userData = null
          if (res.data.data) {
            userData = res.data.data
          } else if (res.data) {
            userData = res.data
          }
          
          if (!userData) {
            console.error('未能获取有效的用户数据')
            this.handleLoginFailure()
            return
          }
          
          console.log('用户数据:', userData)
          
          // 保存到全局数据和本地存储
          this.globalData.userInfo = userData
          
          // 确保保存用户ID
          if (userData._id) {
            this.globalData.userId = userData._id
            wx.setStorageSync('userId', userData._id)
            console.log('用户ID已设置到全局:', userData._id)
          }
          
          this.globalData.isAdmin = userData.role === 'admin' || userData.isAdmin === true
          wx.setStorageSync('userInfo', userData)
          wx.setStorageSync('isAdmin', this.globalData.isAdmin)
          
          // 如果是管理员用户，直接跳转到管理员界面
          if (this.globalData.isAdmin) {
            console.log('检测到管理员身份，跳转到管理员界面')
            this.globalData.isCheckingLogin = false
            
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/admin/index',
                success: () => {
                  console.log('成功跳转到管理员界面')
                },
                fail: (err) => {
                  console.error('跳转管理员界面失败:', err)
                  // 如果跳转失败，尝试用其他方式
                  wx.reLaunch({
                    url: '/pages/index/index'
                  })
                }
              })
            }, 100)
            return
          }
          
          // 检查普通用户是否已选择机器人
          let selectedRobot = userData.selectedRobot
          console.log('用户已选择的机器人:', selectedRobot)
          
          if (selectedRobot) {
            console.log('用户已绑定机器人，获取机器人信息')
            
            // 处理可能的命名不一致问题
            if (selectedRobot === '悉文') selectedRobot = 'xiwen';
            if (selectedRobot === '悉荟') selectedRobot = 'xihui';
            
            // 根据selectedRobot获取机器人信息
            const robotInfo = this.findRobotInfo(selectedRobot)
            console.log('机器人信息:', robotInfo)
            
            if (robotInfo) {
              // 保存机器人信息
              this.globalData.selectedRobot = robotInfo
              wx.setStorageSync('selectedRobot', robotInfo)
              
              // 跳转到聊天页面
              this.globalData.isCheckingLogin = false
              console.log('准备跳转到聊天页面')
              
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/chat/chat',
                  success: () => {
                    console.log('成功跳转到聊天页面')
                  },
                  fail: (err) => {
                    console.error('跳转聊天页面失败:', err)
                    // 如果跳转失败，尝试用其他方式
                    wx.reLaunch({
                      url: '/pages/index/index'
                    })
                  }
                })
              }, 100)
            } else {
              console.log('未找到机器人信息，跳转到机器人选择页面')
              this.redirectToRobotSelect()
            }
          } else {
            console.log('用户未绑定机器人，跳转到机器人选择页面')
            this.redirectToRobotSelect()
          }
        } else {
          console.log('Token验证失败，重定向到登录页面')
          this.handleLoginFailure()
        }
      },
      fail: (err) => {
        console.error('验证请求失败:', err)
        this.handleLoginFailure()
      }
    })
  },
  
  // 处理登录失败的情况
  handleLoginFailure() {
    console.log('处理登录失败')
    // 清除所有存储的数据
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('isAdmin')
    wx.removeStorageSync('selectedRobot')
    
    // 重置全局数据
    this.globalData.userInfo = null
    this.globalData.selectedRobot = null
    this.globalData.isAdmin = false
    this.globalData.isCheckingLogin = false
    
    // 跳转到登录页面
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },
  
  // 重定向到机器人选择页面
  redirectToRobotSelect() {
    this.globalData.isCheckingLogin = false
    console.log('准备跳转到机器人选择页面')
    
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/robot-select/robot-select',
        success: () => {
          console.log('成功跳转到机器人选择页面')
        },
        fail: (err) => {
          console.error('跳转机器人选择页面失败:', err)
        }
      })
    }, 100)
  },
  
  // 根据机器人名称查找对应的机器人信息
  findRobotInfo(robotName) {
    console.log('查找机器人信息:', robotName)
    // 默认的机器人信息
    const defaultRobots = [
      {
        _id: 'xiwen',
        name: '悉文',
        avatar: '/assets/images/xiwen.png',
        description: '专业、稳重的男性机器人助手',
        personality: 'male'
      },
      {
        _id: 'xihui',
        name: '悉荟',
        avatar: '/assets/images/xihui.png',
        description: '温柔、贴心的女性机器人助手',
        personality: 'female'
      }
    ];
    
    // 尝试根据名称匹配
    if (robotName === '悉文' || robotName === 'xiwen') {
      return defaultRobots[0];
    } else if (robotName === '悉荟' || robotName === 'xihui') {
      return defaultRobots[1];
    }
    
    // 如果没有匹配到，返回null
    return null;
  },

  getUserInfo() {
    return new Promise((resolve, reject) => {
      // 首先检查全局数据中是否有用户信息
      if (this.globalData.userInfo) {
        console.log('从全局数据获取用户信息');
        resolve(this.globalData.userInfo);
        return;
      }

      // 检查本地存储
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        console.log('从本地存储获取用户信息');
        this.globalData.userInfo = userInfo;
        resolve(userInfo);
        return;
      }

      // 如果没有找到用户信息，检查是否有token
      const token = wx.getStorageSync('token');
      if (!token) {
        console.log('未找到token，用户未登录');
        reject(new Error('用户未登录'));
        return;
      }

      // 从服务器获取用户信息
      console.log('从服务器获取用户信息');
      wx.request({
        url: 'http://127.0.0.1:3005/api/user/info',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          console.log('获取用户信息成功:', res);
          if (res.statusCode === 200 && res.data && res.data.success) {
            const userData = res.data.data;
            
            // 检查用户角色
            const isAdmin = userData.role === 'admin';
            userData.isAdmin = isAdmin;
            
            // 更新全局数据和本地存储
            this.globalData.userInfo = userData;
            wx.setStorageSync('userInfo', userData);
            
            resolve(userData);
          } else {
            console.error('获取用户信息失败:', res);
            reject(new Error('获取用户信息失败'));
          }
        },
        fail: (error) => {
          console.error('请求用户信息出错:', error);
          reject(error);
        }
      });
    });
  }
}) 