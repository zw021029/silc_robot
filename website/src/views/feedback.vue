<template>
  <div class="feedback-container">
    <div class="page-header">
      <h2>反馈管理</h2>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索反馈内容"
        class="search-input"
        clearable
        @clear="handleSearch"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="filterType"
        placeholder="反馈类型"
        clearable
        class="filter-select"
        @change="handleSearch"
      >
        <el-option label="建议" value="suggestion" />
        <el-option label="问题" value="problem" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select
        v-model="filterStatus"
        placeholder="处理状态"
        clearable
        class="filter-select"
        @change="handleSearch"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
      </el-select>
    </div>

    <el-table
      v-loading="loading"
      :data="feedbackList"
      style="width: 100%"
      border
    >
      <el-table-column prop="content" label="反馈内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="feedback_type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.feedback_type)">
            {{ getTypeText(row.feedback_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contact_info" label="联系方式" width="150" />
      <el-table-column prop="created_at" label="提交时间" width="180" >
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleViewDetail(row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="反馈详情"
      width="600px"
    >
      <div v-if="currentFeedback" class="feedback-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="反馈内容">
            {{ currentFeedback.content }}
          </el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            <el-tag :type="getTypeTag(currentFeedback.feedback_type)">
              {{ getTypeText(currentFeedback.feedback_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">
            {{ currentFeedback.contact_info }}
          </el-descriptions-item>
          <el-descriptions-item label="用户ID">
            {{ currentFeedback.user_id }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentFeedback.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFeedbackList } from '@/api/admin'
import { formatDateTime } from '@/utils/date'

interface FeedbackItem {
  id: number
  content: string
  feedback_type: string
  created_at: string
  user_id: string
  contact_info: string
}

const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const currentFeedback = ref<FeedbackItem | null>(null)

const getTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    '功能建议': 'success',
    '问题反馈': 'danger',
    '其他': 'info'
  }
  return typeMap[type] || 'info'
}

const getTypeText = (type: string) => {
  return type || '其他'
}

const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决'
  }
  return statusMap[status] || '未知'
}

const fetchFeedbackList = async () => {
  loading.value = true
  try {
    const response = await getFeedbackList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      type: filterType.value,
      status: filterStatus.value
    })
    feedbackList.value = response.list
    total.value = response.total
  } catch (error) {
    ElMessage.error('获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchFeedbackList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchFeedbackList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchFeedbackList()
}

const handleViewDetail = (row: FeedbackItem) => {
  currentFeedback.value = row
  detailVisible.value = true
}

const formatDate = (date: string) => {
  return formatDateTime(date)
}

onMounted(() => {
  fetchFeedbackList()
})
</script>

<style scoped>
.feedback-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 120px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.feedback-detail {
  padding: 20px 0;
}
</style> 