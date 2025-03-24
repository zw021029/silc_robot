import { getUserList, getChatRecords, uploadKnowledgeBase } from '../../api/admin'

Page({
  data: {
    activeTab: 'users', // users, chats, knowledge
    users: [],
    chats: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    const app = getApp()
    if (!app.globalData.isAdmin) {
      wx.showModal({
        title: '提示',
        content: '您没有管理员权限',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
      return
    }
    this.loadData()
  },

  // 切换标签
  handleTabChange(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      activeTab: tab,
      page: 1,
      hasMore: true,
      users: [],
      chats: []
    })
    this.loadData()
  },

  // 加载数据
  async loadData() {
    if (this.data.loading || !this.data.hasMore) return

    try {
      this.setData({ loading: true })

      const { activeTab, page } = this.data
      let res

      if (activeTab === 'users') {
        res = await getUserList({ page, limit: 20 })
        this.setData({
          users: [...this.data.users, ...res.users],
          hasMore: res.hasMore
        })
      } else if (activeTab === 'chats') {
        res = await getChatRecords({ page, limit: 20 })
        this.setData({
          chats: [...this.data.chats, ...res.chats],
          hasMore: res.hasMore
        })
      }

      this.setData({ page: page + 1 })

    } catch (error) {
      wx.showToast({
        title: error.message || '获取数据失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 上传知识库
  async handleUpload() {
    try {
      const res = await wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['pdf']
      })

      const file = res.tempFiles[0]
      
      wx.showLoading({
        title: '上传中...'
      })

      await uploadKnowledgeBase({
        filePath: file.path,
        name: file.name
      })

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })

    } catch (error) {
      wx.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({
      users: [],
      chats: [],
      page: 1,
      hasMore: true
    })
    await this.loadData()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadData()
  }
}) 