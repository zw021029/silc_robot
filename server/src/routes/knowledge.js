const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const knowledgeController = require('../controllers/knowledge');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 添加问答对
router.post('/', auth.verifyToken, validate.validateKnowledge, knowledgeController.addKnowledge);

// 批量添加问答对
router.post('/batch', auth.verifyToken, validate.validateKnowledge, knowledgeController.batchAddKnowledge);

// 更新问答对
router.put('/:id', auth.verifyToken, validate.validateKnowledge, knowledgeController.updateKnowledge);

// 删除问答对
router.delete('/:id', auth.verifyToken, knowledgeController.deleteKnowledge);

// 获取问答对列表
router.get('/list', auth.verifyToken, validate.validatePagination, validate.validateSearch, knowledgeController.getKnowledgeList);

// 导入知识库
router.post('/import', auth.verifyToken, upload.single('file'), validate.validateFile, knowledgeController.importKnowledge);

// 导出知识库
router.get('/export', auth.verifyToken, knowledgeController.exportKnowledge);

module.exports = router; 