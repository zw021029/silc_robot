const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');
const auth = require('../middlewares/auth');

// 提交反馈
router.post('/submit', auth.verifyToken, feedbackController.submitFeedback);

// 获取反馈列表（需要管理员权限）
router.get('/list', auth.verifyToken, feedbackController.getFeedbackList);

module.exports = router; 