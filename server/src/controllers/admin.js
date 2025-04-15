const Message = require('../models/message');
const Knowledge = require('../models/knowledge');
const User = require('../models/user');
const logger = require('../utils/logger');
const { processTextToQA } = require('../services/openai');

// 获取对话历史
exports.getChatHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { startDate, endDate, userId } = req.query;
    const query = {};

    // 构建查询条件
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (userId) {
      query.userId = userId;
    }

    // 执行查询
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('userId', 'username nickname');

    // 获取总数
    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        list: messages,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    logger.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话历史失败',
      error: error.message
    });
  }
};

// 获取知识库列表
exports.getKnowledgeList = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, keyword } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (keyword) {
      query.$or = [
        { question: new RegExp(keyword, 'i') },
        { answer: new RegExp(keyword, 'i') }
      ];
    }

    const knowledgeList = await Knowledge.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Knowledge.countDocuments(query);

    res.json({
      success: true,
      data: {
        knowledgeList,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('获取知识库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识库列表失败'
    });
  }
};

// 添加知识库条目
exports.addKnowledge = async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;
    const knowledge = new Knowledge({
      question,
      answer,
      category,
      tags
    });
    await knowledge.save();
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    logger.error('添加知识库条目失败:', error);
    res.status(500).json({
      success: false,
      message: '添加知识库条目失败'
    });
  }
};

// 更新知识库条目
exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, tags } = req.body;
    const knowledge = await Knowledge.findByIdAndUpdate(
      id,
      { question, answer, category, tags },
      { new: true }
    );
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    logger.error('更新知识库条目失败:', error);
    res.status(500).json({
      success: false,
      message: '更新知识库条目失败'
    });
  }
};

// 删除知识库条目
exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    await Knowledge.findByIdAndDelete(id);
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除知识库条目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除知识库条目失败'
    });
  }
};

// 处理文本文件并生成问答对
exports.processTextFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }

    const text = req.file.buffer.toString('utf-8');
    const qaPairs = await processTextToQA(text);

    // 批量保存问答对
    const knowledgeList = await Knowledge.insertMany(
      qaPairs.map(qa => ({
        question: qa.question,
        answer: qa.answer,
        category: 'auto_generated',
        tags: ['auto_generated']
      }))
    );

    res.json({
      success: true,
      data: {
        count: knowledgeList.length,
        knowledgeList
      }
    });
  } catch (error) {
    logger.error('处理文本文件失败:', error);
    res.status(500).json({
      success: false,
      message: '处理文本文件失败'
    });
  }
};
