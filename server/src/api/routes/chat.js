const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat');
const { auth } = require('../../middlewares/auth');
const logger = require('../../utils/logger');

// 获取聊天历史
router.get('/history', auth, (req, res, next) => {
  logger.info('收到获取聊天历史请求');
  next();
}, chatController.getChatHistory);

// 发送消息
router.post('/message', auth, (req, res, next) => {
  logger.info('收到发送消息请求');
  next();
}, chatController.sendMessage);

// 评价聊天
router.post('/evaluate', auth, (req, res, next) => {
  logger.info('收到评价聊天请求');
  next();
}, chatController.evaluateChat);

// 获取聊天积分
router.get('/points/:chatId', auth, (req, res, next) => {
  logger.info('收到获取聊天积分请求');
  next();
}, chatController.getChatPoints);

module.exports = router;
