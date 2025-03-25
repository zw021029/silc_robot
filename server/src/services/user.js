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
      selectedRobot: 'xiwen',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginTime: new Date(),
    });

    await user.save();
    return this.generateToken(user);
  }

  async login({ username, password, code }) {
    console.log('service收到的登录参数:', { username, password, code });
    let user;

    // 通过用户名密码登录
    if (username && password) {
      // 先尝试用户名登录
      user = await User.findOne({ username }).select('+password');
      
      // 如果用户名不存在，尝试用手机号登录
      if (!user) { 
         // TODO 验证是否为手机号格式
        user = await User.findOne({ phone: username }).select('+password');
      }
      
      // 如果都找不到用户
      if (!user) {
        throw new Error('用户名或手机号不存在');
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('密码错误');
      }
    }
    // 通过微信code登录
    else if (code) {
      try {
        // TODO: 实现微信登录逻辑
        // const wxResult = await getWxUserInfo(code);
        // user = await User.findOne({ openid: wxResult.openid });
        throw new Error('微信登录功能尚未实现');
      } catch (error) {
        throw new Error(`微信登录失败: ${error.message}`);
      }
    } 
    else {
      throw new Error('请提供有效的登录信息'); 
    }

    // 更新最后登录时间
    user.lastLoginTime = new Date();
    await user.save();

    return this.generateAuthResponse(user);
  }

  generateAuthResponse(user) {
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
      userInfo: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        phone: user.phone,
        points: user.points,
        role: user.role,
        avatar: user.avatar,
        lastLoginTime: user.lastLoginTime
      },
      selectedRobot: user.selectedRobot || null
    };
  }
}

module.exports = new UserService();