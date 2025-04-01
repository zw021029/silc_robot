const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history');
const auth = require('../middlewares/auth');

// 获取历史记录列表
router.get('/list', auth.verifyToken, historyController.getHistoryList);

// 获取历史记录详情
router.get('/detail/:id', auth.verifyToken, historyController.getHistoryDetail);

// 删除历史记录
router.delete('/:id', auth.verifyToken, historyController.deleteHistory);

// 获取历史记录统计
router.get('/stats', auth.verifyToken, historyController.getHistoryStats);

module.exports = router; 