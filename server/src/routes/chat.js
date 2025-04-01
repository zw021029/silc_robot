const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const auth = require('../middlewares/auth');

// 获取聊天历史
router.get('/:robotId/history', auth.verifyToken, chatController.getChatHistory);

// 发送消息
router.post('/message', auth.verifyToken, chatController.sendMessage);

// 获取机器人回复
router.post('/reply', auth.verifyToken, chatController.getRobotReply);

// 评价聊天
router.post('/:messageId/evaluate', auth.verifyToken, chatController.evaluateChat);

// 获取聊天积分
router.get('/points/:chatId', auth.verifyToken, chatController.getChatPoints);

// 获取聊天详情
router.get('/detail/:id', auth.verifyToken, chatController.getChatDetail);

// 获取聊天上下文
router.get('/context/:robotId', auth.verifyToken, chatController.getChatContext);

// 清除上下文
router.delete('/context/:robotId', auth.verifyToken, chatController.clearChatContext);

// 获取机器人配置
router.get('/robot/:robotId/config', auth.verifyToken, chatController.getRobotConfig);

// 更新机器人配置
router.put('/robot/:robotId/config', auth.verifyToken, chatController.updateRobotConfig);

module.exports = router; 