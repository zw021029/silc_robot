<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本设置" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="120px"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicForm.systemName" />
            </el-form-item>
            <el-form-item label="系统描述" prop="description">
              <el-input v-model="basicForm.description" type="textarea" rows="3" />
            </el-form-item>
            <el-form-item label="管理员邮箱" prop="adminEmail">
              <el-input v-model="basicForm.adminEmail" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleBasicSubmit">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="机器人设置" name="robot">
          <el-form
            ref="robotFormRef"
            :model="robotForm"
            :rules="robotRules"
            label-width="120px"
          >
            <el-form-item label="机器人名称" prop="robotName">
              <el-input v-model="robotForm.robotName" />
            </el-form-item>
            <el-form-item label="欢迎语" prop="welcomeMessage">
              <el-input v-model="robotForm.welcomeMessage" type="textarea" rows="3" />
            </el-form-item>
            <el-form-item label="响应超时时间" prop="timeout">
              <el-input-number v-model="robotForm.timeout" :min="1" :max="60" />
              <span class="unit">秒</span>
            </el-form-item>
            <el-form-item label="最大上下文数" prop="maxContext">
              <el-input-number v-model="robotForm.maxContext" :min="1" :max="20" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRobotSubmit">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <el-form
            ref="securityFormRef"
            :model="securityForm"
            :rules="securityRules"
            label-width="120px"
          >
            <el-form-item label="密码策略" prop="passwordPolicy">
              <el-checkbox-group v-model="securityForm.passwordPolicy">
                <el-checkbox label="uppercase">必须包含大写字母</el-checkbox>
                <el-checkbox label="lowercase">必须包含小写字母</el-checkbox>
                <el-checkbox label="number">必须包含数字</el-checkbox>
                <el-checkbox label="special">必须包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="密码最小长度" prop="minPasswordLength">
              <el-input-number v-model="securityForm.minPasswordLength" :min="6" :max="20" />
            </el-form-item>
            <el-form-item label="登录失败次数" prop="maxLoginAttempts">
              <el-input-number v-model="securityForm.maxLoginAttempts" :min="3" :max="10" />
              <span class="unit">次后锁定账号</span>
            </el-form-item>
            <el-form-item label="会话超时时间" prop="sessionTimeout">
              <el-input-number v-model="securityForm.sessionTimeout" :min="30" :max="1440" />
              <span class="unit">分钟</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSecuritySubmit">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const activeTab = ref('basic')

const basicFormRef = ref<FormInstance>()
const robotFormRef = ref<FormInstance>()
const securityFormRef = ref<FormInstance>()

const basicForm = reactive({
  systemName: '智能问答系统',
  description: '基于人工智能的智能问答系统，为学生提供课程咨询、作业辅导等服务。',
  adminEmail: 'admin@example.com'
})

const robotForm = reactive({
  robotName: '小智',
  welcomeMessage: '你好！我是智能问答机器人，有什么可以帮你的吗？',
  timeout: 30,
  maxContext: 5
})

const securityForm = reactive({
  passwordPolicy: ['uppercase', 'lowercase', 'number'],
  minPasswordLength: 8,
  maxLoginAttempts: 5,
  sessionTimeout: 120
})

const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入管理员邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const robotRules = {
  robotName: [
    { required: true, message: '请输入机器人名称', trigger: 'blur' }
  ],
  welcomeMessage: [
    { required: true, message: '请输入欢迎语', trigger: 'blur' }
  ]
}

const securityRules = {
  passwordPolicy: [
    { required: true, message: '请选择密码策略', trigger: 'change' }
  ],
  minPasswordLength: [
    { required: true, message: '请输入密码最小长度', trigger: 'blur' }
  ]
}

const handleBasicSubmit = async () => {
  if (!basicFormRef.value) return
  
  try {
    await basicFormRef.value.validate()
    // TODO: 实现保存逻辑
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleRobotSubmit = async () => {
  if (!robotFormRef.value) return
  
  try {
    await robotFormRef.value.validate()
    // TODO: 实现保存逻辑
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleSecuritySubmit = async () => {
  if (!securityFormRef.value) return
  
  try {
    await securityFormRef.value.validate()
    // TODO: 实现保存逻辑
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit {
  margin-left: 8px;
  color: #666;
}
</style> 