import { 
  getPointsBalance, 
  getPointsHistory, 
  getExchangeItems,
  exchangeItem,
  getPointsRules
} from '../../api/points'

Page({
  data: {
    currentTab: 'points', // points, exchange
    balance: 0,
    pointsList: [],
    exchangeItems: [],
    rules: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    showRules: false
  },

  onLoad() {
    this.loadPointsBalance()
    this.loadPointsList()
    this.loadExchangeItems()
    this.loadPointsRules()
  },

  // 切换标签
  handleSwitchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ currentTab: tab })
  },

  // 加载积分余额
  async loadPointsBalance() {
    try {
      const res = await getPointsBalance()
      this.setData({ balance: res.data })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载积分明细
  async loadPointsList(refresh = false) {
    if (this.data.loading) return

    const { page, pageSize, pointsList } = this.data
    
    if (refresh) {
      this.setData({ 
        page: 1,
        pointsList: [],
        hasMore: true
      })
    }

    this.setData({ loading: true })

    try {
      const params = {
        page: refresh ? 1 : page,
        pageSize
      }

      const res = await getPointsHistory(params)
      
      this.setData({
        pointsList: refresh ? res.data.list : [...pointsList, ...res.data.list],
        hasMore: res.data.list.length === pageSize,
        page: refresh ? 2 : page + 1
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 加载兑换商品
  async loadExchangeItems() {
    try {
      const res = await getExchangeItems()
      this.setData({ exchangeItems: res.data })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载积分规则
  async loadPointsRules() {
    try {
      const res = await getPointsRules()
      this.setData({ rules: res.data })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 显示积分规则
  handleShowRules() {
    this.setData({ showRules: true })
  },

  // 隐藏积分规则
  handleHideRules() {
    this.setData({ showRules: false })
  },

  // 兑换商品
  async handleExchange(e) {
    const { item } = e.currentTarget.dataset
    
    if (this.data.balance < item.points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    try {
      await wx.showModal({
        title: '确认兑换',
        content: `确定要使用${item.points}积分兑换${item.name}吗？`,
        confirmText: '确定兑换'
      })

      await exchangeItem(item.id)

      wx.showToast({
        title: '兑换成功',
        icon: 'success'
      })

      // 刷新积分余额和明细
      this.loadPointsBalance()
      this.loadPointsList(true)

    } catch (error) {
      if (error.errMsg !== 'showModal:fail cancel') {
        wx.showToast({
          title: error.message || '兑换失败',
          icon: 'none'
        })
      }
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPointsBalance()
    this.loadPointsList(true)
    this.loadExchangeItems()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.currentTab === 'points' && this.data.hasMore) {
      this.loadPointsList()
    }
  }
}) 