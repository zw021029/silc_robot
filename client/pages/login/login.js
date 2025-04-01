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
      showToast('请输入正确的手机号')
      return
    }

    try {
      await request.post('/user/send-code', { phone })
      
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
    
    if (!username || !password) {
      showToast('请输入用户名和密码')
      return
    }

    this.setData({ loading: true })

    try {
      console.log('发送登录请求，参数:', { username, password })
      
      const res = await request.post('/user/login', {
        username,
        password
      })

      console.log('登录成功，响应数据:', res)

      // 保存token和用户信息
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('userInfo', res.data.userInfo)
      
      // 验证token是否保存成功
      const savedToken = wx.getStorageSync('token')
      if (!savedToken) {
        throw new Error('token保存失败')
      }
      
      console.log('token已保存:', savedToken)
      
      // 跳转到机器人选择页面
      await reLaunch('/pages/robot-select/robot-select')
      
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
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('userInfo', res.data.userInfo)
      
      // 跳转到机器人选择页面
      await reLaunch('/pages/robot-select/robot-select')
      
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