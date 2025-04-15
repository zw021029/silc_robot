const { showToast, reLaunch } = require('../../utils/util')
const request = require('../../utils/request')

Page({
  data: {
    currentView: 'login', // login, register, reset
    loading: false,
    counting: false,
    countDown: 60,
    
    // 登录表单
    username: '',
    password: '',
    
    // 注册和重置密码表单
    phone: '',
    verifyCode: '',
    newPassword: '',
    confirmPassword: '',
    remember: false
  },

  // 切换视图
  switchToLogin() {
    this.setData({ currentView: 'login' })
  },

  switchToRegister() {
    this.setData({ currentView: 'register' })
  },

  switchToReset() {
    this.setData({ currentView: 'reset' })
  },

  // 发送验证码
  async sendVerifyCode() {
    const { phone, counting } = this.data
    if (counting) return
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      showToast('请输入正确的手机号')
      return
    }

    try {
      await request.post('/api/user/send-code', { phone })
      
      // 开始倒计时
      this.setData({ counting: true })
      this.startCountDown()
      
      showToast('验证码已发送', 'success')
    } catch (error) {
      showToast(error.message || '发送失败')
    }
  },

  startCountDown() {
    let count = 60
    const timer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(timer)
        this.setData({
          counting: false,
          countDown: 60
        })
      } else {
        this.setData({ countDown: count })
      }
    }, 1000)
  },

  // 登录
  async handleLogin() {
    const { username, password, remember, loading } = this.data
    
    if (loading) return
    
    // 验证输入
    if (!username.trim() || !password.trim()) {
      showToast('请输入账号和密码')
      return
    }
    
    this.setData({ loading: true })
    
    try {
      const res = await request.post('/api/user/login', {
        username,
        password,
        remember
      })
      
      if (!res || !res.token) {
        throw new Error('登录失败：无效的响应格式')
      }
      
      console.log('登录成功，获取到数据:', res)
      
      // 保存登录凭证和用户信息
      wx.setStorageSync('token', res.token)
      
      // 确保用户信息格式正确
      let userData = res.user || res.userInfo || res.data
      
      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', userData)
      
      // 显式保存用户ID，确保后续操作能够使用
      if (userData && userData._id) {
        wx.setStorageSync('userId', userData._id)
      }
      
      // 保存全局数据
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.userInfo = userData
        if (userData && userData._id) {
          app.globalData.userId = userData._id
        }
      }
      
      // 用户是管理员
      if (userData && (userData.role === 'admin' || userData.isAdmin === true)) {
        console.log('管理员用户登录成功，跳转到管理员界面')
        // 保存管理员状态
        wx.setStorageSync('isAdmin', true)
        app.globalData.isAdmin = true
        
        // 跳转到管理员界面
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/admin/index',
            success: () => {
              console.log('成功跳转到管理员界面')
            },
            fail: (error) => {
              console.error('跳转管理员界面失败:', error)
              showToast('页面跳转失败，请重试')
            }
          })
        }, 500)
        return
      }
      
      // 普通用户处理逻辑
      if (userData && userData.selectedRobot && 
         (userData.selectedRobot === '悉文' || 
          userData.selectedRobot === '悉荟' || 
          userData.selectedRobot === 'xiwen' || 
          userData.selectedRobot === 'xihui')) {
        console.log('普通用户已绑定机器人:', userData.selectedRobot)
        // 普通用户已绑定机器人，直接跳转到聊天页面
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/chat/chat',
            success: () => {
              console.log('成功跳转到聊天页面')
            },
            fail: (error) => {
              console.error('跳转聊天页面失败:', error)
              // 如果跳转失败，重试
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/chat/chat'
                })
              }, 1000)
            }
          })
        }, 500)
      } else {
        console.log('用户未绑定机器人，跳转到机器人选择页面')
        // 用户未绑定机器人，跳转到机器人选择页面
        try {
          // 先跳转到聊天页面（tabBar页面）
          await wx.switchTab({
            url: '/pages/chat/chat'
          })
          // 然后跳转到机器人选择页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/robot-select/robot-select',
              fail: (error) => {
                console.error('跳转机器人选择页面失败:', error)
                showToast('页面跳转失败，请重试')
              }
            })
          }, 100)
        } catch (error) {
          console.error('跳转失败:', error)
          showToast('页面跳转失败，请重试')
        }
      }
      
    } catch (error) {
      console.error('登录失败:', error)
      showToast(error.message || '登录失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 注册
  async handleRegister() {
    const { phone, verifyCode, newPassword, confirmPassword, loading } = this.data
    if (loading) return
    
    if (!phone || !verifyCode || !newPassword || !confirmPassword) {
      showToast('请填写完整信息')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('两次密码不一致')
      return
    }

    this.setData({ loading: true })
    
    try {
      await request.post('/api/user/register', {
        phone,
        verifyCode,
        password: newPassword
      })

      showToast('注册成功', 'success')

      // 延迟切换到登录页
      setTimeout(() => {
        this.switchToLogin()
      }, 1500)

    } catch (error) {
      showToast(error.message || '注册失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 重置密码
  async handleResetPassword() {
    const { phone, verifyCode, newPassword, confirmPassword, loading } = this.data
    if (loading) return
    
    if (!phone || !verifyCode || !newPassword || !confirmPassword) {
      showToast('请填写完整信息')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('两次密码不一致')
      return
    }

    this.setData({ loading: true })
    
    try {
      await request.post('/api/user/reset-password', {
        phone,
        verifyCode,
        newPassword
      })

      showToast('重置成功', 'success')

      // 延迟切换到登录页
      setTimeout(() => {
        this.switchToLogin()
      }, 1500)

    } catch (error) {
      showToast(error.message || '重置失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录
  async handleWxLogin() {
    try {
      const { code } = await wx.login()
      const res = await request.post('/api/user/wx-login', { code })
      
      // 保存token和用户信息
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      
      // 检查用户是否为管理员
      if (res.user && (res.user.role === 'admin' || res.user.isAdmin === true)) {
        console.log('管理员用户微信登录成功，跳转到管理员界面')
        // 保存管理员状态
        wx.setStorageSync('isAdmin', true)
        // 跳转到管理员界面
        wx.reLaunch({
          url: '/pages/admin/index'
        })
      }
      // 普通用户处理逻辑 
      else if (res.user && res.user.selectedRobot) {
        console.log('普通用户已绑定机器人:', res.user.selectedRobot)
        // 用户已绑定机器人，直接跳转到聊天页面
        await reLaunch('/pages/chat/chat')
      } else {
        console.log('普通用户未绑定机器人，跳转到机器人选择页面')
        // 用户未绑定机器人，跳转到机器人选择页面
        await reLaunch('/pages/robot-select/robot-select')
      }
      
    } catch (error) {
      console.error('微信登录失败:', error)
      showToast(error.message || '微信登录失败')
    }
  },

  // 输入框事件
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  }
}) 