const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/admin');
const { verifyToken } = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const validate = require('../middlewares/validate');

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 所有路由都需要认证和管理员权限
router.use(verifyToken);
router.use(adminAuth);

// 对话历史相关路由
router.get('/chat-history', adminController.getChatHistory);

// 知识库管理相关路由
router.get('/knowledge', adminController.getKnowledgeList);
router.post('/knowledge', validate.validateKnowledge, adminController.addKnowledge);
router.put('/knowledge/:id', validate.validateKnowledge, adminController.updateKnowledge);
router.delete('/knowledge/:id', adminController.deleteKnowledge);
router.post('/knowledge/process-file', upload.single('file'), adminController.processTextFile);

module.exports = router; 