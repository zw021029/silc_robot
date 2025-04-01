const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robot');
const auth = require('../middlewares/auth');

// 获取机器人列表
router.get('/list', robotController.getRobotList);

// 获取机器人详情
router.get('/:id', robotController.getRobotDetail);

// 绑定机器人
router.post('/:id/bind', auth.verifyToken, robotController.bindRobot);

module.exports = router; 