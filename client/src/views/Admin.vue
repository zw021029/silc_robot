<template>
  <div class="admin-container">
    <h1>管理员控制面板</h1>
    <div class="admin-content">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>用户管理</span>
          </div>
        </template>
        <el-table :data="users" style="width: 100%">
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="role" label="角色" />
          <el-table-column prop="lastLoginTime" label="最后登录时间" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const users = ref([]);

const fetchUsers = async () => {
  try {
    const response = await axios.get('/api/user/list');
    users.value = response.data;
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  }
};

const handleEdit = (user) => {
  // TODO: 实现编辑用户功能
  console.log('编辑用户:', user);
};

const handleDelete = async (user) => {
  try {
    await axios.delete(`/api/user/${user._id}`);
    ElMessage.success('删除成功');
    fetchUsers();
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

.admin-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 