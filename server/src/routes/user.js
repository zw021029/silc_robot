const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middlewares/auth');

// 验证token
router.get('/verify', userController.verifyUserToken);

// 用户登录
router.post('/login', userController.login);

// 用户注册
router.post('/register', userController.register);

// 获取用户信息
router.get('/info', auth.verifyToken, userController.getUserInfo);

// 更新用户信息
router.put('/info', auth.verifyToken, userController.updateUserInfo);

module.exports = router; 