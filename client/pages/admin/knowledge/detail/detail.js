import { getKnowledgeDetail, deleteKnowledge } from '../../../../api/admin'

Page({
  data: {
    fileId: '',
    fileDetail: {},
    recentQueries: [],
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ fileId: options.id })
      this.loadFileDetail()
    } else {
      wx.showToast({
        title: '文件ID不存在',
        icon: 'none'
      })
      this.goBack()
    }
  },

  // 加载文件详情
  async loadFileDetail() {
    const { fileId } = this.data
    
    try {
      const res = await getKnowledgeDetail(fileId)
      this.setData({
        fileDetail: res.data.fileDetail,
        recentQueries: res.data.recentQueries || [],
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
    const { fileDetail } = this.data
    const itemList = ['导出数据']

    if (fileDetail.status !== 'processing') {
      itemList.push('删除文件')
    }
    if (fileDetail.status === 'error') {
      itemList.push('重新训练')
    }

    wx.showActionSheet({
      itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.handleExport()
            break
          case 1:
            if (itemList[1] === '删除文件') {
              this.handleDelete()
            } else {
              this.handleRetrain()
            }
            break
          case 2:
            this.handleRetrain()
            break
        }
      }
    })
  },

  // 删除文件
  async handleDelete() {
    const { fileId } = this.data

    try {
      await wx.showModal({
        title: '提示',
        content: '确定要删除该文件吗？删除后无法恢复。',
        confirmText: '删除'
      })

      await deleteKnowledge(fileId)
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      // 返回上一页并刷新列表
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        prevPage.loadFileList(true)
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

  // 重新训练
  handleRetrain() {
    const { fileId } = this.data
    // 返回上一页并触发重新训练
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.handleRetrain(fileId)
    }
    this.goBack()
  },

  // 导出数据
  handleExport() {
    // TODO: 实现导出功能
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  },

  // 查看所有调用记录
  viewAllQueries() {
    const { fileId } = this.data
    wx.navigateTo({
      url: `/pages/admin/knowledge/queries/queries?id=${fileId}`
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadFileDetail()
    wx.stopPullDownRefresh()
  }
}) 