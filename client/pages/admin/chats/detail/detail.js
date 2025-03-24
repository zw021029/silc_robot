import { getChatDetail } from '../../../../api/admin'

Page({
  data: {
    chatId: '',
    chatDetail: {},
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ chatId: options.id })
      this.loadChatDetail()
    } else {
      wx.showToast({
        title: '对话ID不存在',
        icon: 'none'
      })
      this.goBack()
    }
  },

  // 加载对话详情
  async loadChatDetail() {
    const { chatId } = this.data
    
    try {
      const res = await getChatDetail(chatId)
      this.setData({
        chatDetail: res.data,
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

  // 显示操作菜单
  showActionSheet() {
    wx.showActionSheet({
      itemList: ['删除对话', '导出对话'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.handleDelete()
            break
          case 1:
            this.handleExport()
            break
        }
      }
    })
  },

  // 删除对话
  async handleDelete() {
    try {
      await wx.showModal({
        title: '提示',
        content: '确定要删除这条对话吗？',
        confirmText: '删除'
      })

      // TODO: 调用删除API
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      // 返回上一页并刷新列表
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        prevPage.loadChatList(true)
      }
      this.goBack()

    } catch (error) {
      if (error.errMsg !== 'showModal:fail cancel') {
        wx.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        })
      }
    }
  },

  // 导出对话
  handleExport() {
    // TODO: 实现导出功能
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadChatDetail()
    wx.stopPullDownRefresh()
  }
}) 