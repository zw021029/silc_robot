import * as echarts from '../../../components/ec-canvas/echarts'
import { getStatistics } from '../../../api/admin'

let userChart = null
let chatChart = null

function initUserChart(canvas, width, height, dpr) {
  userChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })
  canvas.setChart(userChart)
  return userChart
}

function initChatChart(canvas, width, height, dpr) {
  chatChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })
  canvas.setChart(chatChart)
  return chatChart
}

Page({
  data: {
    loading: true,
    dateRanges: ['最近7天', '最近30天', '最近90天'],
    dateRangeIndex: 0,
    coreStats: {
      totalUsers: 0,
      totalChats: 0,
      avgScore: 0,
      avgAccuracy: 0,
      userTrend: 0,
      chatTrend: 0,
      scoreTrend: 0,
      accuracyTrend: 0
    },
    knowledgeStats: [],
    ratingStats: [],
    performanceStats: {
      avgResponseTime: 0,
      avgTokens: 0,
      stability: 0
    },
    userTrendEc: {
      onInit: initUserChart
    },
    chatTrendEc: {
      onInit: initChatChart
    }
  },

  onLoad() {
    this.loadStatistics()
  },

  // 加载统计数据
  async loadStatistics() {
    this.setData({ loading: true })
    try {
      const days = this.getDays()
      const res = await getStatistics(days)
      const { 
        coreStats, 
        knowledgeStats, 
        ratingStats, 
        performanceStats,
        userTrend,
        chatTrend 
      } = res.data

      this.setData({
        coreStats,
        knowledgeStats,
        ratingStats,
        performanceStats,
        loading: false
      })

      // 更新图表
      this.updateUserChart(userTrend)
      this.updateChatChart(chatTrend)

    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 更新用户趋势图表
  updateUserChart(data) {
    const option = {
      grid: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        axisLabel: {
          fontSize: 10,
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          fontSize: 10,
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      series: [{
        data: data.values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#1890ff'
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(24,144,255,0.2)'
            }, {
              offset: 1,
              color: 'rgba(24,144,255,0)'
            }]
          }
        }
      }]
    }
    userChart.setOption(option)
  },

  // 更新对话趋势图表
  updateChatChart(data) {
    const option = {
      grid: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        axisLabel: {
          fontSize: 10,
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          fontSize: 10,
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      series: [{
        data: data.values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#07c160'
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(7,193,96,0.2)'
            }, {
              offset: 1,
              color: 'rgba(7,193,96,0)'
            }]
          }
        }
      }]
    }
    chatChart.setOption(option)
  },

  // 处理日期范围变化
  handleDateRangeChange(e) {
    this.setData({
      dateRangeIndex: e.detail.value
    })
    this.loadStatistics()
  },

  // 获取天数
  getDays() {
    const index = this.data.dateRangeIndex
    switch(index) {
      case 0: return 7
      case 1: return 30
      case 2: return 90
      default: return 7
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStatistics()
    wx.stopPullDownRefresh()
  }
}) 