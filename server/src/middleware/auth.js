const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/user');
const config = require('../config');

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

module.exports = {
  authenticateToken
}; 