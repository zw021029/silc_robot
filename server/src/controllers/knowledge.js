const knowledgeService = require('../services/knowledge');
const logger = require('../utils/logger');

// 添加问答对
exports.addKnowledge = async (req, res) => {
  try {
    const knowledge = await knowledgeService.addKnowledge(req.body);
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    logger.error('添加问答对失败:', error);
    res.status(500).json({
      success: false,
      message: '添加问答对失败'
    });
  }
};

// 批量添加问答对
exports.batchAddKnowledge = async (req, res) => {
  try {
    const result = await knowledgeService.batchAddKnowledge(req.body.items);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('批量添加问答对失败:', error);
    res.status(500).json({
      success: false,
      message: '批量添加问答对失败'
    });
  }
};

// 更新问答对
exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const knowledge = await knowledgeService.updateKnowledge(id, req.body);
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    logger.error('更新问答对失败:', error);
    res.status(500).json({
      success: false,
      message: '更新问答对失败'
    });
  }
};

// 删除问答对
exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await knowledgeService.deleteKnowledge(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('删除问答对失败:', error);
    res.status(500).json({
      success: false,
      message: '删除问答对失败'
    });
  }
};

// 获取问答对列表
exports.getKnowledgeList = async (req, res) => {
  try {
    const result = await knowledgeService.getKnowledgeList(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取问答对列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取问答对列表失败'
    });
  }
};

// 导入知识库
exports.importKnowledge = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }
    
    const result = await knowledgeService.importKnowledge(req.file, req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('导入知识库失败:', error);
    res.status(500).json({
      success: false,
      message: '导入知识库失败'
    });
  }
};

// 导出知识库
exports.exportKnowledge = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const result = await knowledgeService.exportKnowledge(req.query, format);
    
    // 发送文件
    res.download(result.filePath, `knowledge_${new Date().getTime()}.${format === 'csv' ? 'csv' : 'xlsx'}`);
  } catch (error) {
    logger.error('导出知识库失败:', error);
    res.status(500).json({
      success: false,
      message: '导出知识库失败'
    });
  }
};
