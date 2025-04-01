// 任务API
import request from '../utils/request';

/**
 * 获取用户任务列表
 */
export function getUserTasks() {
  return request({
    url: '/api/tasks',
    method: 'GET'
  });
}

/**
 * 初始化用户任务
 */
export function initUserTasks() {
  return request({
    url: '/api/tasks/init',
    method: 'POST'
  });
}

/**
 * 更新任务进度
 * @param {string} taskType - 任务类型
 * @param {number} progressIncrement - 进度增量
 */
export function updateTaskProgress(taskType, progressIncrement = 1) {
  return request({
    url: '/api/tasks/progress',
    method: 'POST',
    data: {
      taskType,
      progressIncrement
    }
  });
}

/**
 * 手动完成任务
 * @param {string} taskType - 任务类型
 */
export function completeTask(taskType) {
  return request({
    url: '/api/tasks/complete',
    method: 'POST',
    data: {
      taskType
    }
  });
}

/**
 * 获取任务类型列表
 * 用于将前端任务索引转换为后端任务类型
 */
export const TASK_TYPES = {
  DAILY_CHAT: 'daily_chat',
  FAVORITE_DIALOG: 'favorite_dialog',
  CUSTOMIZE_APPEARANCE: 'customize_appearance'
};