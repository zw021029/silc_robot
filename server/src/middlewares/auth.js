const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/response');
const User = require('../models/user');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证token'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 从数据库获取完整的用户信息
    const user = await User.findById(decoded._id).select('-password');
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    req.user = user;

    logger.info('用户认证成功:', {
      userId: user._id,
      username: user.username
    });

    next();
  } catch (error) {
    logger.error('身份验证失败:', error);
    return res.status(401).json({
      code: 401,
      message: 'token无效或已过期'
    });
  }
};

/**
 * 用户身份验证中间件
 * 验证请求头中的JWT令牌
 */
const auth = async (req, res, next) => {
  try {
    // 获取授权头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, '请提供有效的身份验证令牌');
    }

    // 提取令牌
    const token = authHeader.split(' ')[1];
    if (!token) {
      return unauthorized(res, '请提供有效的身份验证令牌');
    }

    // 验证令牌
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查找用户
    const user = await User.findById(decoded._id);
    if (!user) {
      return unauthorized(res, '用户不存在或已被删除');
    }

    // 将用户信息附加到请求对象
    req.user = {
      _id: user._id,
      id: user._id,
      username: user.username,
      role: user.role,
      nickname: user.nickname,
      isAdmin: user.isAdmin
    };

    logger.info('用户认证成功:', { userId: user._id, username: user.username });
    
    next();
  } catch (err) {
    logger.error('身份验证失败:', err);
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, '身份验证令牌已过期');
    }
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, '无效的身份验证令牌');
    }
    return unauthorized(res, '身份验证失败');
  }
};

/**
 * 管理员权限验证中间件
 * 必须在auth中间件之后使用
 */
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return unauthorized(res, '需要管理员权限');
  }
  next();
};

module.exports = {
  verifyToken: auth,
  adminAuth,
  authenticateToken
};