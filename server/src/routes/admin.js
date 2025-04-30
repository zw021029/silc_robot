const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/auth');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// 创建控制器实例
const adminController = new AdminController();

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 管理员登录 - 不需要认证
router.post('/login', adminController.login);

// 所有其他路由都需要认证和管理员权限
router.use(verifyToken);
router.use(auth.adminAuth);

// 用户管理
router.get('/users', adminController.getUserList);
router.get('/users/:userId', adminController.getUserDetail);
router.put('/users/:userId/status', adminController.updateUserStatus);

// 对话记录管理
router.get('/chats', adminController.getChatList);
router.get('/chats/:chatId', adminController.getChatDetail);

// 知识库管理
router.get('/knowledge', adminController.getKnowledgeList);
router.post('/knowledge/upload', adminController.uploadKnowledge);
router.delete('/knowledge/:id', adminController.deleteKnowledge);
router.put('/knowledge/:id', adminController.updateKnowledge);

// 统计数据
router.get('/stats', adminController.getStats);

// 用户反馈
router.get('/feedback', adminController.getFeedbackList);

// 对话历史相关路由
router.get('/chat-history', adminController.getChatHistory);

// 知识库管理相关路由
router.post('/knowledge', validate.validateKnowledge, adminController.addKnowledge);
router.post('/knowledge/process-file', upload.single('file'), adminController.processTextFile);

module.exports = router; 