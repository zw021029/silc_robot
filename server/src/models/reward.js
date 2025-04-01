const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rewardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['daily_login', 'chat_completion', 'share', 'invite', 'custom'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  condition: {
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'unlimited'],
      default: 'unlimited'
    },
    maxCount: {
      type: Number,
      default: -1 // -1表示无限制
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    requirements: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 用户奖励记录模型
const userRewardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  pointsTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'PointsTransaction'
  }
});

// 索引以提高查询速度
rewardSchema.index({ type: 1, status: 1 });
rewardSchema.index({ 'condition.startDate': 1, 'condition.endDate': 1 });

userRewardSchema.index({ userId: 1, rewardId: 1 });
userRewardSchema.index({ userId: 1, claimedAt: -1 });

// 更新时间的中间件
rewardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Reward = mongoose.model('Reward', rewardSchema);
const UserReward = mongoose.model('UserReward', userRewardSchema);

module.exports = {
  Reward,
  UserReward
};
