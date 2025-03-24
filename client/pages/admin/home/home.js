import { getStats } from '../../../api/admin'

Page({
  data: {
    menuList: [
      {
        id: 'users',
        name: '用户管理',
        icon: '/assets/images/admin/users.png',
        url: '/pages/admin/users/users'
      },
      {
        id: 'chats',
        name: '对话记录',
        icon: '/assets/images/admin/chats.png',
        url: '/pages/admin/chats/chats'
      },
      {
        id: 'knowledge',
        name: '知识库管理',
        icon: '/assets/images/admin/knowledge.png',
        url: '/pages/admin/knowledge/knowledge'
      },
      {
        id: 'stats',
        name: '数据统计',
        icon: '/assets/images/admin/stats.png',
        url: '/pages/admin/stats/stats'
      },
      {
        id: 'settings',
        name: '系统设置',
        icon: '/assets/images/admin/settings.png',
        url: '/pages/admin/settings/settings'
      }
    ],
    stats: {
      totalUsers: 0,
      totalChats: 0,
      todayChats: 0,
      totalKnowledge: 0
    },
    loading: true
  },

  onLoad() {
    this.loadStats()
  },

  // 加载统计数据
  async loadStats() {
    try {
      const res = await getStats()
      this.setData({
        stats: res.data,
        loading: false
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 菜单点击
  handleMenuClick(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  },

  // 退出登录
  async handleLogout() {
    try {
      await wx.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        confirmText: '退出登录'
      })

      // 清除管理员登录信息
      wx.removeStorageSync('admin_token')
      wx.removeStorageSync('admin_info')

      // 返回登录页
      wx.redirectTo({
        url: '/pages/admin/login/login'
      })

    } catch (error) {
      if (error.errMsg !== 'showModal:fail cancel') {
        wx.showToast({
          title: error.message || '退出失败',
          icon: 'none'
        })
      }
    }
  }
}) 