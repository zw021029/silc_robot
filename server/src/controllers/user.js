const userService = require('../services/user');
const User = require('../models/user');
const { generateToken, verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const redis = require('../utils/redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const fetch = require('node-fetch');
const smsService = require('../utils/sendsms');

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;

    // 验证手机号格式
    if (!/^(?:\+86|0086)?1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '无效的手机号码格式'
      });
    }

    // 检查是否频繁发送
    const lastSentTime = await redis.get(`verification_code_time:${phone}`);
    if (lastSentTime) {
      return res.status(429).json({
        code: 429,
        message: '请求过于频繁，请稍后再试'
      });
    }

    // 生成6位数字验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 调用短信服务发送验证码
    if (process.env.NODE_ENV === 'production') {
      try {
        const result = await smsService.sendVerificationCode(phone, code);
        logger.info('短信发送成功', {
          phone,
          requestId: result.requestId,
          fee: result.details[0].fee
        });
      } catch (error) {
        logger.error('短信发送失败:', error);
        return res.status(500).json({
          code: 500,
          message: '短信发送失败，请稍后重试',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }

    // 将验证码保存到Redis，设置5分钟过期
    await redis.set(`verification_code:${phone}`, code, 'EX', 300);
    // 设置发送频率限制，1分钟内不能重复发送
    await redis.set(`verification_code_time:${phone}`, Date.now(), 'EX', 60);

    // 开发环境下直接返回验证码
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        code: 200,
        message: '验证码发送成功',
        data: { code }
      });
    }

    res.json({
      code: 200,
      message: '验证码发送成功'
    });
  } catch (err) {
    logger.error('发送验证码失败:', err);
    res.status(500).json({
      code: 500,
      message: '发送验证码失败，请稍后重试'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      // 即使用户不存在，也执行一次虚假的 bcrypt 比较，消耗相同时间
      await bcrypt.compare(password, '$2a$10$fakehashfakehashfakehashfake'); // 虚假哈希
      return res.status(401).json({ message: '用户名或密码错误' }); // 模糊提示
    }

    console.log(`找到用户: id=${user._id}, 用户名=${user.username}`);

    let isMatch = false;
    isMatch = await bcrypt.compare(password, user.password);
    console.log(`标准密码验证结果: ${isMatch ? '通过' : '失败'}`);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      logger.dev(`用户状态不是active: ${user.status}`);
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    console.log(`更新最后登录时间: ${user.lastLogin}`);

    // 生成token
    const token = generateToken(user);
    console.log(`生成的token: ${token}`);

    // 返回用户信息和token
    const responseData = {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin',
        selectedRobot: user.selectedRobot,
        lastLogin: user.lastLogin
      }
    };
    console.log(`登录成功, 返回数据:`, responseData);

    res.json(responseData);
  } catch (error) {
    logger.error('登录失败:', error);
    console.error('登录处理过程中发生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, phone, code } = req.body;

    // 验证必填字段
    if (!username || !password || !phone || !code) {
      return res.status(400).json({
        code: 400,
        message: '请填写所有必填字段'
      });
    }

    // 验证手机号格式
    if (!/^(?:\+86|0086)?1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '无效的手机号码格式'
      });
    }

    // 检查验证码
    const verificationCode = await redis.get(`verification_code:${phone}`);
    if (!verificationCode) {
      return res.status(400).json({
        code: 400,
        message: '验证码已过期，请重新获取'
      });
    }
    
    if (verificationCode !== code) {
      return res.status(400).json({
        code: 400,
        message: '验证码错误'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 检查手机号是否已存在
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        code: 400,
        message: '该手机号已注册'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      password, // 密码加密在model层处理
      phone,
      registerTime: new Date(),
      lastLogin: new Date()
    });

    await user.save();

    // 注册成功后删除验证码
    await redis.del(`verification_code:${phone}`);
    await redis.del(`verification_code_time:${phone}`);

    // 生成token
    const token = generateToken(user);

    // 返回用户信息和token
    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          role: user.role,
          selectedRobot: user.selectedRobot,
          registerTime: user.registerTime,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    logger.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，注册失败'
    });
  }
};

// 验证token
exports.verifyUserToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证token'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: user
    });
  } catch (error) {
    logger.error('验证token失败:', error);
    res.status(401).json({
      code: 401,
      message: 'token无效或已过期'
    });
  }
};

// 获取用户信息
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
  try {
    const { nickname, avatar, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 更新昵称
    if (nickname !== undefined) {
      user.nickname = nickname;
    }

    // 更新头像
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // 更新邮箱
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: '邮箱已存在' });
      }
      user.email = email;
    }

    await user.save();

    // 返回更新后的用户信息
    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      message: '用户信息更新成功',
      user: updatedUser
    });
  } catch (error) {
    logger.error('更新用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户列表
exports.getUserList = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const { nickname, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证旧密码
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: '旧密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    logger.error('修改密码失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 选择机器人
exports.selectRobot = async (req, res) => {
  try {
    const { selectedRobot } = req.body;
    const userId = req.user.id;

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户是否已经选择了机器人
    if (user.selectedRobot) {
      return res.status(400).json({ message: '您已经选择了机器人，无法更改' });
    }

    // 转换旧的机器人名称为新的格式
    let robotSelection = selectedRobot;
    if (selectedRobot === 'xiwen') {
      robotSelection = '悉文';
    } else {
      robotSelection = '悉荟';
    }

    // 验证机器人选择是否有效
    if (!['悉文', '悉荟'].includes(robotSelection)) {
      return res.status(400).json({ message: '无效的机器人选择' });
    }

    // 更新用户的机器人选择
    user.selectedRobot = robotSelection;
    await user.save();

    logger.info(`用户 ${user.username} 选择了机器人: ${robotSelection}`);

    res.json({
      message: '机器人选择成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        selectedRobot: user.selectedRobot,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('选择机器人失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 微信登录
exports.wechatLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    // 调用微信接口获取openid和session_key
    const appid = config.wechat.appid;
    const secret = config.wechat.secret;
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      return res.status(400).json({
        code: 400,
        message: '微信登录失败',
        error: data
      });
    }

    const { openid, session_key } = data;

    // 查找用户
    let user = await User.findOne({ openid });

    if (!user) {
      // 创建新用户
      user = new User({
        openid,
        loginType: 'wechat',
        username: `wx_${openid.slice(0, 8)}`,
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city,
        language: userInfo.language
      });

      await user.save();
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成token
    const token = generateToken(user);

    // 返回用户信息和token
    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          isAdmin: user.isAdmin || user.role === 'admin',
          selectedRobot: user.selectedRobot,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    logger.error('微信登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};


