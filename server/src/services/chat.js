const Message = require('../models/message');
const { Knowledge } = require('../models/knowledge');
const logger = require('../utils/logger');
const { getEmbedding, calculateSimilarity } = require('../utils/embedding');
const aiService = require('./ai');
const User = require('../models/user');
const Chat = require('../models/chat');

// 获取聊天历史
exports.getChatHistory = async (userId) => {
  try {
    // 获取用户选择的机器人
    const user = await User.findById(userId);
    if (!user || !user.selectedRobot) {
      throw new Error('用户未选择机器人');
    }

    // 获取所有对话
    const chats = await Chat.find({ 
      userId,
      robotId: user.selectedRobot 
    })
    .sort({ createdAt: -1 })
    .populate('userMessage robotReply');

    // 获取所有消息
    const messages = await Message.find({
      userId,
      robotId: user.selectedRobot
    })
    .sort({ createdAt: 1 });

    // 按时间顺序组织消息
    const messageList = messages.map(msg => ({
      _id: msg._id,
      id: msg._id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
      isUser: msg.type === 'user'
    }));

    return {
      robotId: user.selectedRobot,
      messages: messageList,
      chats: chats.map(chat => ({
        _id: chat._id,
        id: chat._id,
        userMessage: chat.userMessage ? {
          _id: chat.userMessage._id,
          id: chat.userMessage._id,
          content: chat.userMessage.content,
          createdAt: chat.userMessage.createdAt
        } : null,
        robotReply: chat.robotReply ? {
          _id: chat.robotReply._id,
          id: chat.robotReply._id,
          content: chat.robotReply.content,
          createdAt: chat.robotReply.createdAt
        } : null,
        createdAt: chat.createdAt
      }))
    };
  } catch (error) {
    logger.error('获取聊天历史失败:', error);
    throw error;
  }
};

// 保存消息
exports.saveMessage = async (userId, content, type, robotId = null) => {
  try {
    // 参数检查
    if (!userId || !content || !type) {
      logger.error('保存消息失败: 缺少必要参数', { userId, content, type });
      throw new Error('缺少必要参数');
    }

    // 获取用户选择的机器人
    const user = await User.findById(userId);
    if (!user) {
      logger.error('保存消息失败: 用户不存在', { userId });
      throw new Error('用户不存在');
    }

    if (!user.selectedRobot) {
      logger.error('保存消息失败: 用户未选择机器人', { userId });
      throw new Error('用户未选择机器人');
    }

    // 创建新的对话或获取最新的对话
    let chat = await Chat.findOne({
      userId,
      robotId: user.selectedRobot
    }).sort({ createdAt: -1 });

    if (!chat) {
      chat = await Chat.create({
        userId,
        robotId: user.selectedRobot,
        userMessage: null,
        robotReply: null
      });
      logger.info('创建新对话', { chatId: chat._id });
    }

    // 保存消息
    const message = await Message.create({
      userId,
      robotId: robotId || user.selectedRobot,
      content,
      type,
      chatId: chat._id
    });

    if (!message || !message._id) {
      logger.error('保存消息失败: 消息创建失败');
      throw new Error('消息创建失败');
    }

    // 更新对话的消息
    if (type === 'user') {
      await Chat.updateOne(
        { _id: chat._id },
        { $set: { userMessage: message._id } }
      );
      logger.info('更新用户消息', { chatId: chat._id, messageId: message._id });
    } else if (type === 'robot') {
      await Chat.updateOne(
        { _id: chat._id },
        { $set: { robotReply: message._id } }
      );
      logger.info('更新机器人回复', { chatId: chat._id, messageId: message._id });
    }

    return message;
  } catch (error) {
    logger.error('保存消息失败:', error);
    throw error;
  }
};

// 获取对话详情
exports.getChatDetail = async (chatId, userId) => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      userId
    }).populate('userMessage robotReply');

    if (!chat) {
      return null;
    }

    // 转换为包含 id 字段的对象
    const result = {
      _id: chat._id,
      id: chat._id,
      userId: chat.userId,
      robotId: chat.robotId,
      userMessage: chat.userMessage ? {
        _id: chat.userMessage._id,
        id: chat.userMessage._id,
        content: chat.userMessage.content,
        type: chat.userMessage.type,
        createdAt: chat.userMessage.createdAt
      } : null,
      robotReply: chat.robotReply ? {
        _id: chat.robotReply._id,
        id: chat.robotReply._id,
        content: chat.robotReply.content,
        type: chat.robotReply.type,
        createdAt: chat.robotReply.createdAt
      } : null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };

    return result;
  } catch (error) {
    logger.error('获取对话详情失败:', error);
    throw error;
  }
};

// 获取机器人回复
exports.getRobotReply = async (userId, message) => {
  try {
    // 参数检查
    if (!userId || !message) {
      logger.error('获取机器人回复失败: 缺少必要参数', { userId, message });
      throw new Error('缺少必要参数');
    }

    // 获取用户选择的机器人
    const user = await User.findById(userId);
    if (!user) {
      logger.error('获取机器人回复失败: 用户不存在', { userId });
      throw new Error('用户不存在');
    }

    if (!user.selectedRobot) {
      logger.error('获取机器人回复失败: 用户未选择机器人', { userId });
      throw new Error('用户未选择机器人');
    }

    logger.info('开始生成机器人回复', { userId, message, robotId: user.selectedRobot });

    // 获取用户消息的向量表示
    const userVector = await getEmbedding(message);
    if (!userVector) {
      logger.error('获取机器人回复失败: 无法生成向量表示');
      throw new Error('无法生成向量表示');
    }

    // 从知识库中查找最相关的答案
    const knowledgeList = await Knowledge.find({ robotId: user.selectedRobot });
    if (!knowledgeList || knowledgeList.length === 0) {
      logger.warn('知识库为空，使用默认回复', { robotId: user.selectedRobot });
      return {
        _id: null,
        id: null,
        content: `抱歉，${user.selectedRobot === 'xiwen' ? '俺' : '人家'}暂时不知道该怎么回答这个问题。`,
        type: 'robot',
        robotId: user.selectedRobot
      };
    }

    logger.info(`从知识库中找到 ${knowledgeList.length} 条记录`);

    let bestMatch = null;
    let maxSimilarity = 0;

    for (const knowledge of knowledgeList) {
      try {
        if (!knowledge.vector) {
          logger.warn('知识条目缺少向量表示', { knowledgeId: knowledge._id, title: knowledge.title });
          continue;
        }

        // 确保向量是有效的格式
        const similarity = calculateSimilarity(userVector, knowledge.vector);
        logger.info('计算相似度结果', { 
          title: knowledge.title, 
          similarity, 
          vectorType: knowledge.vector instanceof Map ? 'Map' : typeof knowledge.vector
        });

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = knowledge;
        }
      } catch (error) {
        logger.error('计算相似度失败:', error, { 
          knowledgeId: knowledge._id,
          title: knowledge.title
        });
        continue;
      }
    }

    // 如果找到相似度大于阈值的答案，使用该答案
    if (bestMatch && maxSimilarity > 0.5) {
      logger.info('找到匹配的答案', { 
        similarity: maxSimilarity,
        question: bestMatch.title,
        answer: bestMatch.content,
        knowledgeId: bestMatch._id
      });
      return {
        _id: bestMatch._id,
        id: bestMatch._id,
        content: bestMatch.content,
        type: 'robot',
        robotId: user.selectedRobot
      };
    }

    // 如果没有找到合适的答案，返回默认回复
    logger.info('未找到匹配的答案，使用默认回复', { maxSimilarity });
    return {
      _id: null,
      id: null,
      content: `抱歉，${user.selectedRobot === 'xiwen' ? '俺' : '人家'}暂时不知道该怎么回答这个问题。`,
      type: 'robot',
      robotId: user.selectedRobot
    };
  } catch (error) {
    logger.error('获取机器人回复失败:', error);
    throw error;
  }
};

// 调整回复风格
function adjustReplyStyle(content, robotId) {
  if (robotId === 'xiwen') {
    // 悉文：更加男性化的回答方式
    return content
      .replace(/我/g, '俺')
      .replace(/您/g, '你')
      .replace(/请问/g, '问一下')
      .replace(/谢谢/g, '谢了')
      .replace(/不好意思/g, '抱歉')
      .replace(/麻烦/g, '帮个忙')
      .replace(/可以吗/g, '行不')
      .replace(/好的/g, '成');
  } else if (robotId === 'xihui') {
    // 悉荟：更加女性化的回答方式
    return content
      .replace(/我/g, '人家')
      .replace(/你/g, '亲')
      .replace(/请问/g, '麻烦问一下')
      .replace(/谢谢/g, '谢谢亲')
      .replace(/不好意思/g, '抱歉呢')
      .replace(/麻烦/g, '麻烦亲')
      .replace(/可以吗/g, '可以吗亲')
      .replace(/好的/g, '好的呢');
  }
  return content;
}

// 计算聊天积分
exports.calculateChatPoints = async (messageId) => {
  try {
    const chat = await Message.findById(messageId);
    if (!chat) {
      throw new Error('消息不存在');
    }

    // 根据消息长度和复杂度计算积分
    const basePoints = 1;
    const lengthPoints = Math.min(chat.content.length / 50, 2);
    const complexityPoints = chat.content.includes('?') || chat.content.includes('？') ? 1 : 0;
    
    return Math.round(basePoints + lengthPoints + complexityPoints);
  } catch (error) {
    logger.error('计算聊天积分失败:', error);
    throw error;
  }
};
