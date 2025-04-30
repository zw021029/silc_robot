<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" />
        <h1>智能助手管理平台</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">
          <el-icon><DataLine /></el-icon>
          <span>数据看板</span>
        </router-link>
        <router-link to="/knowledge" class="nav-item">
          <el-icon><Collection /></el-icon>
          <span>知识库管理</span>
        </router-link>
        <router-link to="/history" class="nav-item">
          <el-icon><ChatLineRound /></el-icon>
          <span>问答记录</span>
        </router-link>
        <router-link to="/feedback" class="nav-item">
          <el-icon><Message /></el-icon>
          <span>反馈管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            prefix-icon="Search"
          />
        </div>
        <div class="user-info">
          <el-dropdown>
            <span class="user-dropdown">
              <el-avatar :size="32" />
              <span>管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 路由视图 -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataLine, Collection, ChatLineRound, Message } from '@element-plus/icons-vue'

const searchQuery = ref('')
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
}

.logo {
  padding: 0 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo img {
  width: 32px;
  height: 32px;
}

.logo h1 {
  font-size: 18px;
  color: #409eff;
  margin: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.router-link-active {
  background-color: #ecf5ff;
  color: #409eff;
}

.nav-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 60px;
  background-color: #fff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  width: 300px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style> 