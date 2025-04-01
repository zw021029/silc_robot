const express = require('express');
const router = express.Router();
const { notFound } = require('../middlewares/error');
const logger = require('../utils/logger');

// 导入各个路由模块
const userRoutes = require('../routes/user');
const robotRoutes = require('../routes/robot');
const chatRoutes = require('../routes/chat');
const pointsRoutes = require('../routes/points');
const historyRoutes = require('../routes/history');
// const authRoutes = require('./routes/auth');
// ... 其他路由模块

// 测试路由
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务器运行正常' 
  });
});

// 使用路由模块
router.use('/user', (req, res, next) => {
  logger.info(`收到用户相关请求: ${req.method} ${req.url}`);
  next();
}, userRoutes);

router.use('/robot', (req, res, next) => {
  logger.info(`收到机器人相关请求: ${req.method} ${req.url}`);
  next();
}, robotRoutes);

router.use('/chat', (req, res, next) => {
  logger.info(`收到聊天相关请求: ${req.method} ${req.url}`);
  next();
}, chatRoutes);

router.use('/points', (req, res, next) => {
  logger.info(`收到积分相关请求: ${req.method} ${req.url}`);
  next();
}, pointsRoutes);

router.use('/history', (req, res, next) => {
  logger.info(`收到历史记录相关请求: ${req.method} ${req.url}`);
  next();
}, historyRoutes);

// 404 处理
router.use(notFound);

module.exports = router;
