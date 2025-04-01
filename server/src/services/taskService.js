const Task = require('../models/task');
const User = require('../models/user');
const mongoose = require('mongoose');

/**
 * 检查并重置所有需要重置的任务
 * 通常由定时任务调用，如每天凌晨
 */
exports.resetAllTasks = async () => {
  try {
    // 获取所有设置了重置频率的任务
    const tasks = await Task.find({
      resetFrequency: { $ne: 'never' },
      isActive: true
    });
    
    const tasksToUpdate = [];
    
    for (const task of tasks) {
      if (task.shouldReset()) {
        task.reset();
        tasksToUpdate.push(task.save());
      }
    }
    
    if (tasksToUpdate.length > 0) {
      await Promise.all(tasksToUpdate);
      console.log(`已重置 ${tasksToUpdate.length} 个任务`);
    }
    
    return { success: true, resetCount: tasksToUpdate.length };
  } catch (error) {
    console.error('重置任务出错:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 初始化新用户的任务
 * 由用户服务在创建用户后调用
 */
exports.initUserTasks = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 检查用户是否已有任务
    const existingTasks = await Task.find({ userId });
    if (existingTasks.length > 0) {
      return { success: false, message: '用户已有任务' };
    }
    
    // 默认任务列表
    const defaultTasks = [
      {
        userId,
        taskType: 'daily_chat',
        name: '每日对话',
        description: '与AI进行5次对话',
        rewardPoints: 10,
        target: 5,
        resetFrequency: 'daily'
      },
      {
        userId,
        taskType: 'favorite_dialog',
        name: '收藏对话',
        description: '收藏1次精彩对话',
        rewardPoints: 5,
        target: 1,
        resetFrequency: 'daily'
      },
      {
        userId,
        taskType: 'customize_appearance',
        name: '自定义形象',
        description: '定制AI形象外观',
        rewardPoints: 20,
        target: 1,
        resetFrequency: 'never'
      }
    ];
    
    // 创建任务
    const createdTasks = await Task.create(defaultTasks, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    return { success: true, tasks: createdTasks };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('初始化用户任务出错:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 更新任务进度
 * 由各功能模块调用，例如聊天完成后
 */
exports.updateTaskProgress = async (userId, taskType, increment = 1) => {
  try {
    // 查找指定任务
    const task = await Task.findOne({ userId, taskType });
    
    if (!task || !task.isActive) {
      return { success: false, message: '任务不存在或未激活' };
    }
    
    // 如果任务已完成则不更新
    if (task.completed) {
      return { success: true, message: '任务已完成', task };
    }
    
    // 更新进度
    task.progress += increment;
    
    // 检查是否完成
    const wasCompleted = task.checkCompletion();
    
    // 保存更新
    await task.save();
    
    // 返回更新结果
    return {
      success: true,
      task,
      wasCompleted,
      message: wasCompleted ? '任务已完成' : '任务进度已更新'
    };
  } catch (error) {
    console.error('更新任务进度出错:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 处理任务完成奖励
 * 由任务控制器调用
 */
exports.processTaskReward = async (userId, task) => {
  try {
    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    
    // 计算新的积分余额
    const newBalance = (user.points || 0) + task.rewardPoints;
    
    // 更新用户积分
    user.points = newBalance;
    await user.save();
    
    return {
      success: true,
      points: task.rewardPoints,
      newBalance
    };
  } catch (error) {
    console.error('处理任务奖励出错:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取用户的任务完成状态
 */
exports.getUserTaskStatus = async (userId) => {
  try {
    const tasks = await Task.find({ userId, isActive: true });
    
    // 按分类统计任务
    const dailyTasks = tasks.filter(t => t.resetFrequency === 'daily');
    const oneTimeTasks = tasks.filter(t => t.resetFrequency === 'never');
    
    // 计算完成率
    const dailyCompleted = dailyTasks.filter(t => t.completed).length;
    const dailyTotal = dailyTasks.length;
    const dailyCompletionRate = dailyTotal > 0 ? (dailyCompleted / dailyTotal) * 100 : 0;
    
    const oneTimeCompleted = oneTimeTasks.filter(t => t.completed).length;
    const oneTimeTotal = oneTimeTasks.length;
    const oneTimeCompletionRate = oneTimeTotal > 0 ? (oneTimeCompleted / oneTimeTotal) * 100 : 0;
    
    return {
      success: true,
      tasks,
      stats: {
        daily: {
          total: dailyTotal,
          completed: dailyCompleted,
          completionRate: dailyCompletionRate
        },
        oneTime: {
          total: oneTimeTotal,
          completed: oneTimeCompleted,
          completionRate: oneTimeCompletionRate
        },
        overall: {
          total: tasks.length,
          completed: tasks.filter(t => t.completed).length,
          completionRate: tasks.length > 0 
            ? (tasks.filter(t => t.completed).length / tasks.length) * 100 
            : 0
        }
      }
    };
  } catch (error) {
    console.error('获取用户任务状态出错:', error);
    return { success: false, error: error.message };
  }
};