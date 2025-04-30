const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/index');
const logger = require('../utils/logger');

// 用户模型
const userSchema = new Schema({
  openid: { type: String, unique: true, sparse: true }, // 微信用户唯一标识
  loginType: { type: String, enum: ['wechat', 'password'], required: true }, // 区分登录方式
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.loginType === 'password';
    }
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  openid: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  nickname: String,
  avatar: String,
  points: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  selectedRobot: {
    type: String,
    enum: ['悉文', '悉荟', 'xiwen', 'xihui', ''],
    default: '',
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ openid: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ selectedRobot: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isAdmin: 1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 密码比较方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    logger.debug('=== 密码比较开始 ===');
    logger.debug(`输入密码: "${candidatePassword}"`);
    logger.debug(`存储的哈希密码: "${this.password}"`);
    logger.debug(`用户ID: ${this._id}`);
    logger.debug(`用户名: ${this.username}`);
    
    // 使用bcrypt比较密码
    const result = await bcrypt.compare(candidatePassword, this.password);
    logger.debug(`密码比较结果: ${result}`);
    logger.debug('=== 密码比较结束 ===');
    
    return result;
  } catch (error) {
    logger.error('密码比较出错:', error);
    throw error;
  }
};

// 生成JWT令牌的方法
userSchema.methods.generateToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      role: this.role,
      isAdmin: this.isAdmin,
      nickname: this.nickname
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;