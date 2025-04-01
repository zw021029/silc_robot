const userService = require('../services/user');
const User = require('../models/user');
const { generateToken, verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password, code } = req.body;
    console.log('登录请求参数:', { username, password, code }); // 添加日志
    
    // 调用 service 层的登录方法，只传入需要的参数
    const result = await userService.login({ username, password, code });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: result.token,
        userInfo: result.userInfo,  // 注意这里改成 userInfo
        selectedRobot: result.selectedRobot
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const result = await userService.register(req.body);
    res.json({
      success: true,
      message: '注册成功',
      data: {
        token: result.token,
        userInfo: result.userInfo
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '注册失败'
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
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      code: 0,
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
  try {
    const { nickname } = req.body;
    
    const user = await User.findById(req.user._id);
    user.nickname = nickname;
    
    await user.save();
    
    res.json({
      code: 0,
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('更新用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户信息失败'
    });
  }
};