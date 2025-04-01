const express = require('express');
const router = express.Router();
const robotController = require('../../controllers/robot');
const { auth } = require('../../middlewares/auth');
const logger = require('../../utils/logger');

// 获取机器人列表
router.get('/list', auth, (req, res, next) => {
  logger.info('收到获取机器人列表请求');
  next();
}, robotController.getRobotList);

// 获取机器人详情
router.get('/detail/:robotId', auth, (req, res, next) => {
  logger.info('收到获取机器人详情请求');
  next();
}, robotController.getRobotDetail);

// 绑定机器人
router.post('/bind', auth, (req, res, next) => {
  logger.info('收到绑定机器人请求');
  next();
}, robotController.bindRobot);

// 获取当前绑定的机器人
router.get('/current', auth, (req, res, next) => {
  logger.info('收到获取当前机器人请求');
  next();
}, robotController.getCurrentRobot);

// 解绑机器人
router.post('/unbind', auth, (req, res, next) => {
  logger.info('收到解绑机器人请求');
  next();
}, robotController.unbindRobot);

module.exports = router;
