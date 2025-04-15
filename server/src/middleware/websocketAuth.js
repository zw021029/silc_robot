const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const websocketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      logger.error('WebSocket连接缺少token');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    
    logger.info('WebSocket连接认证成功:', {
      userId: socket.userId,
      username: socket.username
    });
    
    next();
  } catch (error) {
    logger.error('WebSocket认证失败:', error);
    next(new Error('Authentication error'));
  }
};

module.exports = websocketAuth; 