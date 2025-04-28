const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points');
const auth = require('../middlewares/auth');

// 获取积分余额
router.get('/balance', auth.verifyToken, pointsController.getPointsBalance);

// 获取积分历史
router.get('/history', auth.verifyToken, pointsController.getPointsHistory);

// 获取兑换商品列表
router.get('/exchange/items', auth.verifyToken, pointsController.getExchangeItems);

// 兑换商品
router.post('/exchange', auth.verifyToken, pointsController.exchangeItem);

// 获取积分规则
router.get('/rules', auth.verifyToken, pointsController.getPointsRules);

// 获取积分统计
router.get('/stats', auth.verifyToken, pointsController.getPointsStats);

// 获取兑换记录
router.get('/records', auth.verifyToken, pointsController.getExchangeRecords);

module.exports = router; 