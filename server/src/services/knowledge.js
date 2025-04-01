const { Knowledge, KnowledgeArticle, KnowledgeCategory } = require('../models/knowledge');
const { getBatchEmbeddings } = require('./embedding');
const fileUtils = require('../utils/file');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// 添加问答对
exports.addKnowledge = async (data) => {
  try {
    const { question, answer, robotId, category, keywords } = data;
    
    // 获取问题的向量表示
    const vector = await getBatchEmbeddings([question]);
    
    const knowledge = new Knowledge({
      question,
      answer,
      robotId,
      category,
      keywords,
      vector: vector[0]
    });
    
    await knowledge.save();
    return knowledge;
  } catch (error) {
    logger.error('添加问答对失败:', error);
    throw error;
  }
};

// 批量添加问答对
exports.batchAddKnowledge = async (items) => {
  try {
    const questions = items.map(item => item.question);
    const vectors = await getBatchEmbeddings(questions);
    
    const knowledgeItems = items.map((item, index) => ({
      ...item,
      vector: vectors[index]
    }));
    
    const result = await Knowledge.insertMany(knowledgeItems);
    return result;
  } catch (error) {
    logger.error('批量添加问答对失败:', error);
    throw error;
  }
};

// 更新问答对
exports.updateKnowledge = async (id, data) => {
  try {
    const knowledge = await Knowledge.findById(id);
    if (!knowledge) {
      throw new Error('问答对不存在');
    }
    
    // 如果问题发生变化，更新向量
    if (data.question && data.question !== knowledge.question) {
      const vector = await getBatchEmbeddings([data.question]);
      data.vector = vector[0];
    }
    
    Object.assign(knowledge, data);
    await knowledge.save();
    
    return knowledge;
  } catch (error) {
    logger.error('更新问答对失败:', error);
    throw error;
  }
};

// 删除问答对
exports.deleteKnowledge = async (id) => {
  try {
    const result = await Knowledge.findByIdAndDelete(id);
    return result;
  } catch (error) {
    logger.error('删除问答对失败:', error);
    throw error;
  }
};

// 获取问答对列表
exports.getKnowledgeList = async (query) => {
  try {
    const { robotId, category, keyword, page = 1, pageSize = 20 } = query;
    
    const filter = {};
    if (robotId) filter.robotId = robotId;
    if (category) filter.category = category;
    if (keyword) {
      filter.$or = [
        { question: new RegExp(keyword, 'i') },
        { answer: new RegExp(keyword, 'i') }
      ];
    }
    
    const total = await Knowledge.countDocuments(filter);
    const items = await Knowledge.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createTime: -1 });
    
    return {
      total,
      items,
      page,
      pageSize
    };
  } catch (error) {
    logger.error('获取问答对列表失败:', error);
    throw error;
  }
};

// 导入知识库
exports.importKnowledge = async (file, options = {}) => {
  try {
    const { robotId = 'xiwen', category = 'general' } = options;
    const filePath = file.path;
    
    // 验证文件类型
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf'];
    if (!fileUtils.validateFileType(filePath, allowedTypes)) {
      throw new Error('不支持的文件类型');
    }
    
    // 根据文件类型解析内容
    let records;
    const ext = fileUtils.getFileExtension(filePath);
    
    switch (ext) {
      case '.csv':
        records = fileUtils.parseCSV(filePath);
        break;
      case '.xlsx':
      case '.xls':
        records = await fileUtils.parseExcel(filePath);
        break;
      case '.pdf':
        records = await fileUtils.parsePDF(filePath);
        break;
      default:
        throw new Error('不支持的文件类型');
    }
    
    // 处理记录
    const processedRecords = records.map(record => ({
      question: record.question || record.问题,
      answer: record.answer || record.答案,
      robotId,
      category,
      keywords: record.keywords || record.关键词 || []
    }));
    
    // 批量添加问答对
    const result = await exports.batchAddKnowledge(processedRecords);
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      message: `成功导入 ${result.length} 条问答对`,
      count: result.length
    };
  } catch (error) {
    logger.error('导入知识库失败:', error);
    throw error;
  }
};

// 导出知识库
exports.exportKnowledge = async (query, format = 'csv') => {
  try {
    const { robotId, category } = query;
    const filter = {};
    if (robotId) filter.robotId = robotId;
    if (category) filter.category = category;
    
    const items = await Knowledge.find(filter)
      .select('question answer robotId category keywords')
      .sort({ createTime: -1 });
    
    // 生成临时文件路径
    const timestamp = new Date().getTime();
    const fileName = `knowledge_${timestamp}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    
    // 根据格式导出文件
    switch (format) {
      case 'csv':
        await fileUtils.exportCSV(items, `${filePath}.csv`);
        break;
      case 'excel':
        await fileUtils.exportExcel(items, `${filePath}.xlsx`);
        break;
      default:
        throw new Error('不支持的导出格式');
    }
    
    return {
      success: true,
      filePath: `${filePath}.${format === 'csv' ? 'csv' : 'xlsx'}`
    };
  } catch (error) {
    logger.error('导出知识库失败:', error);
    throw error;
  }
};
