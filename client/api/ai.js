import { request } from '../utils/request'

/**
 * 获取AI助手信息
 */
export function getAiInfo() {
  return request({
    url: '/api/ai/info',
    method: 'GET'
  })
}

/**
 * 获取AI对话历史
 * @param {Object} params 查询参数
 */
export function getDialogHistory(params) {
  return request({
    url: '/api/ai/dialog/history',
    method: 'GET',
    data: params
  })
}

/**
 * 获取收藏对话
 * @param {Object} params 查询参数
 */
export function getFavoriteDialogs(params) {
  return request({
    url: '/api/ai/dialog/favorite',
    method: 'GET',
    data: params
  })
}

/**
 * 收藏对话
 * @param {String} dialogId 对话ID
 */
export function favoriteDialog(dialogId) {
  return request({
    url: '/api/ai/dialog/favorite',
    method: 'POST',
    data: { dialogId }
  })
}

/**
 * 取消收藏对话
 * @param {String} dialogId 对话ID
 */
export function unfavoriteDialog(dialogId) {
  return request({
    url: `/api/ai/dialog/favorite/${dialogId}`,
    method: 'DELETE'
  })
}

/**
 * 获取AI记忆
 */
export function getAiMemory() {
  return request({
    url: '/api/ai/memory',
    method: 'GET'
  })
}

/**
 * 添加/更新AI记忆
 * @param {Object} data 记忆内容
 */
export function updateAiMemory(data) {
  return request({
    url: '/api/ai/memory',
    method: 'POST',
    data
  })
}

/**
 * 删除AI记忆
 * @param {String} memoryId 记忆ID
 */
export function deleteAiMemory(memoryId) {
  return request({
    url: `/api/ai/memory/${memoryId}`,
    method: 'DELETE'
  })
}

/**
 * 获取对话分析
 */
export function getDialogAnalysis() {
  return request({
    url: '/api/ai/dialog/analysis',
    method: 'GET'
  })
}

/**
 * 更新AI性格
 * @param {Object} data 性格参数
 */
export function updateAiPersonality(data) {
  return request({
    url: '/api/ai/personality',
    method: 'POST',
    data
  })
}

/**
 * 获取AI性格配置
 */
export function getAiPersonality() {
  return request({
    url: '/api/ai/personality',
    method: 'GET'
  })
}

/**
 * 获取AI形象选项
 */
export function getAiAppearanceOptions() {
  return request({
    url: '/api/ai/appearance/options',
    method: 'GET'
  })
}

/**
 * 更新AI形象
 * @param {Object} data 形象参数
 */
export function updateAiAppearance(data) {
  return request({
    url: '/api/ai/appearance',
    method: 'POST',
    data
  })
}

/**
 * 获取AI技能列表
 */
export function getAiSkills() {
  return request({
    url: '/api/ai/skills',
    method: 'GET'
  })
}

/**
 * 升级AI技能
 * @param {String} skillId 技能ID
 */
export function upgradeAiSkill(skillId) {
  return request({
    url: '/api/ai/skills/upgrade',
    method: 'POST',
    data: { skillId }
  })
}

/**
 * 获取AI语音设置
 */
export function getAiVoiceSettings() {
  return request({
    url: '/api/ai/voice',
    method: 'GET'
  })
}

/**
 * 更新AI语音设置
 * @param {Object} data 语音设置
 */
export function updateAiVoiceSettings(data) {
  return request({
    url: '/api/ai/voice',
    method: 'POST',
    data
  })
} 