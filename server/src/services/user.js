const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

class UserService {
  async register(userData) {
    const { username, password, phone, nickname } = userData;
    
    // 检查用户名是否已存在
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new Error('用户名已存在');
      }
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        throw new Error('手机号已注册');
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      password: hashedPassword,
      phone,
      nickname: nickname || username,
      lastLoginTime: new Date()
    });

    await user.save();
    return this.generateToken(user);
  }

  async login(credentials) {
    const { username, password, phone, openid } = credentials;
    let user;

    // 通过用户名登录
    if (username && password) {
      user = await User.findOne({ username }).select('+password');
      if (!user) {
        throw new Error('用户名不存在');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('密码错误');
      }
    }
    // 通过手机号登录
    else if (phone && password) {
      user = await User.findOne({ phone }).select('+password');
      if (!user) {
        throw new Error('手机号未注册');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('密码错误');
      }
    }
    // 通过微信openid登录
    else if (openid) {
      user = await User.findOne({ openid });
      if (!user) {
        throw new Error('用户未绑定微信');
      }
    } else {
      throw new Error('无效的登录方式');
    }

    // 更新最后登录时间
    user.lastLoginTime = new Date();
    await user.save();

    return this.generateToken(user);
  }

  generateToken(user) {
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        username: user.username
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        phone: user.phone,
        points: user.points,
        role: user.role,
        avatar: user.avatar,
        selectedRobot: user.selectedRobot
      }
    };
  }
}

module.exports = new UserService();