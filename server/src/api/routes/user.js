const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user');

// 注册路由
router.post('/register', userController.register);

// 登录路由 - 暂时移除 validate.login 中间件
router.post('/login', userController.login);

// 获取用户信息路由（需要认证）
// router.get('/profile', auth, userController.getProfile);

// 更新用户信息路由（需要认证）
// router.put('/profile', auth, userController.updateProfile);

module.exports = router;