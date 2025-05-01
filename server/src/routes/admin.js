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
router.post('/login', (req, res, next) => {
  adminController.login(req, res, next).catch(next); // 捕获异步错误
});

// 所有其他路由都需要认证和管理员权限
router.use(verifyToken);
router.use(auth.adminAuth);

// 统计数据
router.get('/stats', adminController.getStats);

// 知识库管理
router.get('/knowledge', adminController.getKnowledgeList);
router.post('/knowledge/upload', adminController.uploadKnowledge);
router.put('/knowledge/:id', adminController.updateKnowledge);
router.delete('/knowledge/:id', adminController.deleteKnowledge);

// 对话记录管理
router.get('/chats', adminController.getChatList);
router.get('/chats/:chatId', adminController.getChatDetail);

// 用户反馈
router.get('/feedback', adminController.getFeedbackList);

// 用户管理
router.get('/users', adminController.getUserList);
router.get('/users/:userId', adminController.getUserDetail);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/password', adminController.resetUserPassword);

// 积分商店管理
router.get('/store/items', adminController.getStoreItems); // 获取积分商店商品列表
router.post('/store/items', adminController.addStoreItem); // 添加积分商店商品
router.put('/store/items/:id', adminController.updateStoreItem); // 更新积分商店商品, 修改积分值、库存、图片、名称
router.put('/store/items/:id/status', adminController.updateStoreItemStatus); // 更新积分商店商品状态, 上架/下架
router.delete('/store/items/:id', adminController.deleteStoreItem); // 删除积分商店商品
router.get('/store/records', adminController.getExchangeRecords); // 获取兑换记录
router.post('/store/records/verify', adminController.verifyByCode); // 核销兑换记录

module.exports = router; 