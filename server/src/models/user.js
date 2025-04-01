const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
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
  selectedRobot: {
    type: String,
    enum: ['xiwen', 'xihui'],
    default: 'xiwen'
  },
  lastLoginTime: Date,
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
userSchema.index({ selectedRobot: 1 });

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 生成JWT令牌的方法
userSchema.methods.generateToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      role: this.role,
      nickname: this.nickname
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;