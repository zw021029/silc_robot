const logger = require('../utils/logger');
const cleanupService = require('./cleanup');

// 定时任务列表
const tasks = new Map();

// 添加定时任务
exports.addTask = (name, task, interval) => {
  try {
    if (tasks.has(name)) {
      throw new Error(`任务 ${name} 已存在`);
    }
    
    const taskId = setInterval(task, interval);
    tasks.set(name, taskId);
    
    logger.info(`添加定时任务: ${name}`);
    return taskId;
  } catch (error) {
    logger.error(`添加定时任务失败: ${name}`, error);
    throw error;
  }
};

// 移除定时任务
exports.removeTask = (name) => {
  try {
    const taskId = tasks.get(name);
    if (taskId) {
      clearInterval(taskId);
      tasks.delete(name);
      logger.info(`移除定时任务: ${name}`);
    }
  } catch (error) {
    logger.error(`移除定时任务失败: ${name}`, error);
    throw error;
  }
};

// 启动所有定时任务
exports.startAllTasks = () => {
  try {
    // 启动文件清理任务
    cleanupService.startCleanupTask();
    logger.info('启动文件清理任务');
    
    // 启动向量缓存清理任务
    exports.addTask('vectorCache', async () => {
      try {
        const { clearCache } = require('./embedding');
        clearCache();
        logger.info('清理向量缓存完成');
      } catch (error) {
        logger.error('清理向量缓存失败:', error);
      }
    }, 12 * 60 * 60 * 1000); // 每12小时执行一次
    
    // 启动对话历史清理任务
    exports.addTask('chatHistory', async () => {
      try {
        const { clearHistory } = require('./ai');
        clearHistory();
        logger.info('清理对话历史完成');
      } catch (error) {
        logger.error('清理对话历史失败:', error);
      }
    }, 24 * 60 * 60 * 1000); // 每24小时执行一次
    
    logger.info('所有定时任务已启动');
  } catch (error) {
    logger.error('启动定时任务失败:', error);
    throw error;
  }
};

// 停止所有定时任务
exports.stopAllTasks = () => {
  try {
    for (const [name, taskId] of tasks) {
      clearInterval(taskId);
      tasks.delete(name);
      logger.info(`停止定时任务: ${name}`);
    }
    
    logger.info('所有定时任务已停止');
  } catch (error) {
    logger.error('停止定时任务失败:', error);
    throw error;
  }
};

// 获取任务状态
exports.getTaskStatus = () => {
  const status = {};
  for (const [name, taskId] of tasks) {
    status[name] = {
      active: !!taskId,
      lastRun: taskId ? new Date(taskId._idleStart) : null
    };
  }
  return status;
}; 