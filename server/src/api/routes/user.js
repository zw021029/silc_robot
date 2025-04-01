const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user');
const { auth } = require('../../middlewares/auth');
const logger = require('../../utils/logger');

// 注册路由
router.post('/register', (req, res, next) => {
  logger.info('收到注册请求');
  next();
}, userController.register);

// 登录路由
router.post('/login', (req, res, next) => {
  logger.info('收到登录请求');
  next();
}, userController.login);

// 验证token路由（需要认证）
router.get('/verify', auth, (req, res, next) => {
  logger.info('收到验证token请求');
  next();
}, userController.verify);

// 获取用户信息路由（需要认证）
router.get('/profile', auth, (req, res, next) => {
  logger.info('收到获取用户信息请求');
  next();
}, userController.getProfile);

// 更新用户信息路由（需要认证）
router.put('/profile', auth, (req, res, next) => {
  logger.info('收到更新用户信息请求');
  next();
}, userController.updateProfile);

module.exports = router;