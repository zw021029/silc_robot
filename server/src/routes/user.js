const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middlewares/validate');

// 验证token
router.get('/verify', userController.verifyUserToken);

// 发送验证码
router.post('/send-code', validate.validatePhone, userController.sendVerificationCode);

// 用户登录
router.post('/login', userController.login);

// 用户注册
router.post('/register', userController.register);

// 获取用户信息
router.get('/info', authenticateToken, userController.getUserInfo);

// 更新用户信息
router.put('/info', authenticateToken, userController.updateUserInfo);

// 选择机器人
router.post('/select-robot', authenticateToken, userController.selectRobot);

// 获取用户列表（管理员）
router.get('/list', authenticateToken, userController.getUserList);

// 更新用户信息
router.put('/profile', authenticateToken, userController.updateProfile);

// 微信登录
router.post('/wx-login', userController.wechatLogin);

module.exports = router; 