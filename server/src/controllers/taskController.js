const Task = require('../models/task');
const User = require('../models/user');
const PointsTransaction = require('../models/points');
const mongoose = require('mongoose');

/**
 * 获取用户的所有任务
 */
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 查找用户的所有任务
    let tasks = await Task.find({ userId });
    
    // 检查任务是否需要重置（例如每日任务）
    const tasksToUpdate = [];
    
    for (const task of tasks) {
      if (task.shouldReset()) {
        task.reset();
        tasksToUpdate.push(task.save());
      }
    }
    
    // 如果有任务需要重置，等待所有更新完成
    if (tasksToUpdate.length > 0) {
      await Promise.all(tasksToUpdate);
      // 重新获取更新后的任务列表
      tasks = await Task.find({ userId });
    }
    
    return res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取用户任务出错:', error);
    return res.status(500).json({
      success: false,
      message: '获取任务失败',
      error: error.message
    });
  }
};

/**
 * 初始化用户任务
 * 当用户首次登录或需要重置任务时调用
 */
exports.initUserTasks = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user._id;
    
    // 检查用户是否已有任务
    const existingTasks = await Task.find({ userId });
    if (existingTasks.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户已有任务，不需要初始化'
      });
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
    
    return res.status(201).json({
      success: true,
      message: '用户任务初始化成功',
      data: createdTasks
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('初始化用户任务出错:', error);
    return res.status(500).json({
      success: false,
      message: '初始化任务失败',
      error: error.message
    });
  }
};

/**
 * 更新任务进度
 */
exports.updateTaskProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskType, progressIncrement = 1 } = req.body;
    
    if (!taskType) {
      return res.status(400).json({
        success: false,
        message: '任务类型不能为空'
      });
    }
    
    // 查找指定类型的任务
    const task = await Task.findOne({ userId, taskType });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '未找到指定任务'
      });
    }
    
    // 如果任务已完成则不再更新进度
    if (task.completed) {
      return res.status(200).json({
        success: true,
        message: '任务已完成，无需更新进度',
        data: task
      });
    }
    
    // 更新进度
    task.progress += progressIncrement;
    
    // 检查是否完成
    const wasCompleted = task.checkCompletion();
    
    // 保存更新
    await task.save();
    
    // 如果任务完成，奖励积分
    if (wasCompleted) {
      // 获取用户
      const user = await User.findById(userId);
      
      // 更新积分
      const newBalance = (user.points || 0) + task.rewardPoints;
      
      // 记录积分交易
      await PointsTransaction.create({
        userId: userId,
        type: 'earn',
        amount: task.rewardPoints,
        balance: newBalance,
        sourceType: 'system',
        sourceModel: 'Task',
        sourceId: task._id,
        description: `完成任务: ${task.name}`
      });
      
      // 更新用户积分
      user.points = newBalance;
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: wasCompleted ? '任务已完成并获得奖励' : '任务进度已更新',
      data: task
    });
  } catch (error) {
    console.error('更新任务进度出错:', error);
    return res.status(500).json({
      success: false,
      message: '更新任务进度失败',
      error: error.message
    });
  }
};

/**
 * 手动完成任务
 * 主要用于一次性任务或特殊情况
 */
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskType } = req.body;
    
    if (!taskType) {
      return res.status(400).json({
        success: false,
        message: '任务类型不能为空'
      });
    }
    
    // 查找指定类型的任务
    const task = await Task.findOne({ userId, taskType });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '未找到指定任务'
      });
    }
    
    // 如果任务已完成则返回
    if (task.completed) {
      return res.status(200).json({
        success: true,
        message: '任务已完成',
        data: task
      });
    }
    
    // 完成任务
    task.progress = task.target;
    task.completed = true;
    task.completedAt = new Date();
    
    // 保存更新
    await task.save();
    
    // 获取用户
    const user = await User.findById(userId);
    
    // 更新积分
    const newBalance = (user.points || 0) + task.rewardPoints;
    
    // 记录积分交易
    await PointsTransaction.create({
      userId: userId,
      type: 'earn',
      amount: task.rewardPoints,
      balance: newBalance,
      sourceType: 'system',
      sourceModel: 'Task',
      sourceId: task._id,
      description: `完成任务: ${task.name}`
    });
    
    // 更新用户积分
    user.points = newBalance;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: '任务已手动完成并获得奖励',
      data: task
    });
  } catch (error) {
    console.error('手动完成任务出错:', error);
    return res.status(500).json({
      success: false,
      message: '手动完成任务失败',
      error: error.message
    });
  }
}; 