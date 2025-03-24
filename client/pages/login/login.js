import { login, register, resetPassword, sendCode } from '../../api/user'

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
    confirmPassword: ''
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
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    try {
      await sendCode(phone)
      
      // 开始倒计时
      this.setData({ counting: true })
      this.startCountDown()
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
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
    
    if (!username || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    
    try {
      const res = await login({
        username,
        password
      })

      // 保存token
      wx.setStorageSync('token', res.data.token)

      // 更新全局数据
      const app = getApp()
      app.globalData.userInfo = res.data.userInfo
      app.globalData.selectedRobot = res.data.selectedRobot

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 延迟跳转
      setTimeout(() => {
        if (res.data.selectedRobot) {
          wx.reLaunch({ url: '/pages/chat/chat' })
        } else {
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }, 1500)

    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 注册
  async handleRegister() {
    const { phone, verifyCode, password, confirmPassword, loading } = this.data
    if (loading) return
    
    if (!phone || !verifyCode || !password || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    
    try {
      await register({
        phone,
        verifyCode,
        password
      })

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 延迟切换到登录页
      setTimeout(() => {
        this.switchToLogin()
      }, 1500)

    } catch (error) {
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 重置密码
  async handleResetPassword() {
    const { phone, verifyCode, newPassword, confirmPassword, loading } = this.data
    if (loading) return
    
    if (!phone || !verifyCode || !newPassword || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    
    try {
      await resetPassword({
        phone,
        verifyCode,
        newPassword
      })

      wx.showToast({
        title: '重置成功',
        icon: 'success'
      })

      // 延迟切换到登录页
      setTimeout(() => {
        this.switchToLogin()
      }, 1500)

    } catch (error) {
      wx.showToast({
        title: error.message || '重置失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录
  async handleWechatLogin(e) {
    if (this.data.loading) return
    
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '需要授权才能使用',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })
    
    try {
      const loginRes = await wx.login()
      const res = await login({
        code: loginRes.code,
        userInfo: e.detail.userInfo
      })

      wx.setStorageSync('token', res.data.token)
      
      const app = getApp()
      app.globalData.userInfo = res.data.userInfo
      app.globalData.selectedRobot = res.data.selectedRobot

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        if (res.data.selectedRobot) {
          wx.reLaunch({ url: '/pages/chat/chat' })
        } else {
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }, 1500)

    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 