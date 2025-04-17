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
    remember: false,
    showPassword: false
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

  // 切换密码显示状态
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
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
    const { username, password, loading } = this.data
    if (loading) return
    
    if (!username.trim() || !password.trim()) {
      showToast('请输入账号和密码')
      return
    }
    
    this.setData({ loading: true })
    
    try {
      const res = await request.post('/api/user/login', {
        username,
        password
      })
      
      if (!res || !res.token) {
        throw new Error('登录失败：无效的响应格式')
      }
      
      // 保存登录凭证和用户信息
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      
      // 保存全局数据
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.userInfo = res.user
      }
      
      // 用户是管理员
      if (res.user && (res.user.role === 'admin' || res.user.isAdmin === true)) {
        wx.setStorageSync('isAdmin', true)
        app.globalData.isAdmin = true
        reLaunch('/pages/admin/index')
        return
      }
      
      // 普通用户处理逻辑
      if (res.user && res.user.selectedRobot) {
        reLaunch('/pages/chat/chat')
      } else {
        reLaunch('/pages/robot-select/robot-select')
      }
      
    } catch (error) {
      console.error('登录失败:', error)
      showToast(error.message || '登录失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录
  async handleWechatLogin(e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      showToast('授权失败')
      return
    }

    try {
      const { code } = await wx.login()
      const res = await request.post('/api/user/wx-login', { 
        code,
        userInfo: e.detail.userInfo
      })
      
      // 保存登录凭证和用户信息
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      
      // 保存全局数据
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.userInfo = res.user
      }
      
      // 用户是管理员
      if (res.user && (res.user.role === 'admin' || res.user.isAdmin === true)) {
        wx.setStorageSync('isAdmin', true)
        app.globalData.isAdmin = true
        reLaunch('/pages/admin/index')
        return
      }
      
      // 普通用户处理逻辑
      if (res.user && res.user.selectedRobot) {
        reLaunch('/pages/chat/chat')
      } else {
        reLaunch('/pages/robot-select/robot-select')
      }
      
    } catch (error) {
      console.error('微信登录失败:', error)
      showToast(error.message || '微信登录失败')
    }
  },

  // 跳转到注册页
  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },

  // 跳转到重置密码页
  navigateToReset() {
    wx.navigateTo({
      url: '/pages/reset/reset'
    })
  },

  // 输入框事件
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  }
}) 