<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h2>数据看板</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>知识库总量</span>
              <el-icon><Collection /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.knowledgeCount }}</div>
            <div class="trend">
              <span :class="['change', stats.knowledgeTrend >= 0 ? 'up' : 'down']">
                {{ stats.knowledgeTrend >= 0 ? '+' : '' }}{{ stats.knowledgeTrend }}%
              </span>
              <span class="label">较上月</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>问答总量</span>
              <el-icon><ChatLineRound /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.chatCount }}</div>
            <div class="trend">
              <span :class="['change', stats.chatTrend >= 0 ? 'up' : 'down']">
                {{ stats.chatTrend >= 0 ? '+' : '' }}{{ stats.chatTrend }}%
              </span>
              <span class="label">较上月</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>平均响应时间</span>
              <el-icon><Timer /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.avgResponseTime }}ms</div>
            <div class="trend">
              <span :class="['change', stats.responseTimeTrend <= 0 ? 'up' : 'down']">
                {{ stats.responseTimeTrend <= 0 ? '+' : '' }}{{ -stats.responseTimeTrend }}%
              </span>
              <span class="label">较上月</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>用户满意度</span>
              <el-icon><Star /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.satisfactionRate }}%</div>
            <div class="trend">
              <span :class="['change', stats.satisfactionTrend >= 0 ? 'up' : 'down']">
                {{ stats.satisfactionTrend >= 0 ? '+' : '' }}{{ stats.satisfactionTrend }}%
              </span>
              <span class="label">较上月</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>问答趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="chatTrendChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>知识库分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="knowledgeDistributionChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户反馈分析</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="feedbackAnalysisChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Collection, ChatLineRound, Timer, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import axios from 'axios'

interface Stats {
  knowledgeCount: number
  knowledgeTrend: number
  chatCount: number
  chatTrend: number
  avgResponseTime: number
  responseTimeTrend: number
  satisfactionRate: number
  satisfactionTrend: number
}

const stats = ref<Stats>({
  knowledgeCount: 0,
  knowledgeTrend: 0,
  chatCount: 0,
  chatTrend: 0,
  avgResponseTime: 0,
  responseTimeTrend: 0,
  satisfactionRate: 0,
  satisfactionTrend: 0
})

const chatTrendChart = ref<HTMLElement | null>(null)
const knowledgeDistributionChart = ref<HTMLElement | null>(null)
const feedbackAnalysisChart = ref<HTMLElement | null>(null)

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/admin/stats')
    stats.value = response.data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const initChatTrendChart = () => {
  if (!chatTrendChart.value) return
  const chart = echarts.init(chatTrendChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['问答数量', '平均响应时间']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '时间(ms)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '问答数量',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '平均响应时间',
        type: 'line',
        yAxisIndex: 1,
        data: [220, 182, 191, 234, 290, 330]
      }
    ]
  })
}

const initKnowledgeDistributionChart = () => {
  if (!knowledgeDistributionChart.value) return
  const chart = echarts.init(knowledgeDistributionChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '知识库分布',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '课程咨询' },
          { value: 735, name: '作业问题' },
          { value: 580, name: '考试相关' },
          { value: 484, name: '校园生活' },
          { value: 300, name: '其他' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
}

const initFeedbackAnalysisChart = () => {
  if (!feedbackAnalysisChart.value) return
  const chart = echarts.init(feedbackAnalysisChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['建议', '问题', '其他']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '建议',
        type: 'bar',
        stack: 'total',
        data: [320, 302, 301, 334, 390, 330]
      },
      {
        name: '问题',
        type: 'bar',
        stack: 'total',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '其他',
        type: 'bar',
        stack: 'total',
        data: [220, 182, 191, 234, 290, 330]
      }
    ]
  })
}

onMounted(() => {
  fetchStats()
  initChatTrendChart()
  initKnowledgeDistributionChart()
  initFeedbackAnalysisChart()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
}

.number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.trend {
  font-size: 14px;
  color: #909399;
}

.change {
  margin-right: 8px;
}

.change.up {
  color: #67c23a;
}

.change.down {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
}

.chart-container {
  padding: 20px;
}
</style> 