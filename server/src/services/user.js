const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const redis = require('../utils/redis');

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
    return this.generateAuthResponse(user);
  }

  async login({ username, password, code }) {
    try {
      // 查找用户
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证密码
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('密码错误');
      }

      // 如果提供了验证码，验证验证码
      if (code) {
        const savedCode = await redis.get(`verification_code:${user.phone}`);
        if (!savedCode || savedCode !== code) {
          throw new Error('验证码错误或已过期');
        }
        // 验证成功后删除验证码
        await redis.del(`verification_code:${user.phone}`);
      }

      // 生成token
      const token = generateToken(user._id);

      // 获取用户信息（不包含密码）
      const userInfo = await User.findById(user._id).select('-password');

      // 检查用户是否已绑定机器人
      let selectedRobot = null;
      if (userInfo.boundRobots && userInfo.boundRobots.length > 0) {
        // 如果已绑定机器人，使用第一个绑定的机器人
        selectedRobot = userInfo.boundRobots[0];
      }

      // 更新最后登录时间
      user.lastLoginTime = new Date();
      await user.save();

      return {
        token,
        userInfo,
        selectedRobot
      };
    } catch (error) {
      logger.error('登录失败:', error);
      throw error;
    }
  }

  async getUserRobot(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      return user.selectedRobot;
    } catch (error) {
      console.error('获取用户机器人失败:', error);
      return null;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 更新用户信息
      Object.assign(user, updateData, {
        updatedAt: new Date()
      });

      await user.save();
      return this.generateAuthResponse(user);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  generateAuthResponse(user) {
    const token = user.generateToken();

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

  async getUserList() {
    try {
      const users = await User.find().select('-password');
      return users;
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  async getUserInfo(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('用户不存在');
      }

      // 获取用户绑定的机器人
      let selectedRobot = null;
      if (user.boundRobots && user.boundRobots.length > 0) {
        selectedRobot = user.boundRobots[0];
      }

      return {
        ...user.toObject(),
        selectedRobot
      };
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      throw error;
    }
  }
}

module.exports = new UserService();