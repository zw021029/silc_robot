const express = require('express');
const router = express.Router();
const { notFound } = require('../middlewares/error');

// 导入各个路由模块
const userRoutes = require('./routes/user');
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
router.use('/user', userRoutes);
// router.use('/auth', authRoutes);

// 404 处理
router.use(notFound);

module.exports = router;
