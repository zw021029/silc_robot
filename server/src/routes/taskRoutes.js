const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middlewares/auth');

// 所有路由都需要认证
router.use(auth.verifyToken);

// 获取用户的所有任务
router.get('/', taskController.getUserTasks);

// 初始化用户任务
router.post('/init', taskController.initUserTasks);

// 更新任务进度
router.post('/progress', taskController.updateTaskProgress);

// 手动完成任务
router.post('/complete', taskController.completeTask);

module.exports = router; 