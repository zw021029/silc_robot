const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/index');

// 用户模型
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
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
    console.log(`comparePassword 方法: 输入密码="${candidatePassword}"`);
    console.log(`comparePassword 方法: 存储的哈希密码="${this.password}"`);
    
    // 使用bcrypt比较密码
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log(`comparePassword 方法: 比较结果=${result}`);
    
    return result;
  } catch (error) {
    console.error('密码比较出错:', error);
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