import { adminLogin } from '../../../api/admin'

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  // 处理输入
  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
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
      const res = await adminLogin({
        username,
        password
      })

      // 保存token和管理员信息
      wx.setStorageSync('admin_token', res.data.token)
      wx.setStorageSync('admin_info', res.data.adminInfo)

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 跳转到管理后台首页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/admin/home/home'
        })
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