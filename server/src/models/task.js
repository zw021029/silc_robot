const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskType: {
    type: String,
    enum: ['daily_chat', 'favorite_dialog', 'customize_appearance', 'custom'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rewardPoints: {
    type: Number,
    required: true,
    min: 0
  },
  progress: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    required: true,
    min: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  resetFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'never'],
    default: 'daily'
  },
  lastResetAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, { timestamps: true });

// 为每个用户的每个任务类型创建唯一索引
taskSchema.index({ userId: 1, taskType: 1 }, { unique: true });

// 检查任务是否完成的方法
taskSchema.methods.checkCompletion = function() {
  if (this.progress >= this.target && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();
    return true;
  }
  return false;
};

// 重置任务的方法
taskSchema.methods.reset = function() {
  this.progress = 0;
  this.completed = false;
  this.completedAt = null;
  this.lastResetAt = new Date();
};

// 根据频率自动重置任务
taskSchema.methods.shouldReset = function() {
  if (!this.resetFrequency || this.resetFrequency === 'never') return false;
  
  const now = new Date();
  const lastReset = this.lastResetAt;
  
  switch (this.resetFrequency) {
    case 'daily':
      // 检查是否过了一天
      return now.getDate() !== lastReset.getDate() || 
             now.getMonth() !== lastReset.getMonth() ||
             now.getFullYear() !== lastReset.getFullYear();
    case 'weekly':
      // 检查是否过了一周
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return now - lastReset >= oneWeek;
    case 'monthly':
      // 检查是否过了一个月
      return now.getMonth() !== lastReset.getMonth() || 
             now.getFullYear() !== lastReset.getFullYear();
    default:
      return false;
  }
};

module.exports = mongoose.model('Task', taskSchema); 