const logger = require('../utils/logger');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      logger.warn('非管理员访问管理员接口', {
        userId: req.user ? req.user._id : null,
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }
    next();
  } catch (error) {
    logger.error('管理员认证失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = adminAuth; 