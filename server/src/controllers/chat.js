const chatService = require('../services/chat');
const logger = require('../utils/logger');
const Message = require('../models/message');
const User = require('../models/user');
const { unauthorized } = require('../utils/response');

// 获取聊天历史
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await chatService.getChatHistory(userId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('获取聊天历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取聊天历史失败'
    });
  }
};

// 发送消息
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      logger.warn('发送消息失败: 消息内容为空');
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空',
        data: {
          userMessage: null,
          robotReply: null
        }
      });
    }

    if (!userId) {
      logger.warn('发送消息失败: 用户未登录');
      return res.status(401).json({
        success: false,
        error: '用户未登录',
        data: {
          userMessage: null,
          robotReply: null
        }
      });
    }

    logger.info('开始处理用户消息', { userId, content });

    // 保存用户消息
    const userMessage = await chatService.saveMessage(userId, content, 'user');
    if (!userMessage || !userMessage._id) {
      logger.error('保存用户消息失败');
      return res.status(500).json({
        success: false,
        error: '保存用户消息失败',
        data: {
          userMessage: null,
          robotReply: null
        }
      });
    }
    
    // 获取机器人回复
    const robotReply = await chatService.getRobotReply(userId, content);
    if (!robotReply || !robotReply.content) {
      logger.error('获取机器人回复失败');
      return res.status(500).json({
        success: false,
        error: '获取机器人回复失败',
        data: {
          userMessage: {
            _id: userMessage._id,
            id: userMessage._id,
            content: userMessage.content,
            type: userMessage.type,
            createdAt: userMessage.createdAt
          },
          robotReply: null
        }
      });
    }

    // 保存机器人回复
    const savedReply = await chatService.saveMessage(
      userId,
      robotReply.content,
      'robot',
      robotReply.robotId
    );
    if (!savedReply || !savedReply._id) {
      logger.error('保存机器人回复失败');
      return res.status(500).json({
        success: false,
        error: '保存机器人回复失败',
        data: {
          userMessage: {
            _id: userMessage._id,
            id: userMessage._id,
            content: userMessage.content,
            type: userMessage.type,
            createdAt: userMessage.createdAt
          },
          robotReply: null
        }
      });
    }

    logger.info('消息处理完成', {
      userId,
      userMessageId: userMessage._id,
      robotReplyId: savedReply._id
    });

    // 返回消息和回复
    res.json({
      success: true,
      data: {
        userMessage: {
          _id: userMessage._id || '',
          id: userMessage._id || '',
          content: userMessage.content || '',
          type: userMessage.type || 'user',
          createdAt: userMessage.createdAt || new Date()
        },
        robotReply: {
          _id: savedReply._id || '',
          id: savedReply._id || '',
          content: savedReply.content || '',
          type: savedReply.type || 'robot',
          createdAt: savedReply.createdAt || new Date()
        }
      }
    });
  } catch (error) {
    logger.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '发送消息失败',
      data: {
        userMessage: null,
        robotReply: null
      }
    });
  }
};

// 获取机器人回复
exports.getRobotReply = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user._id;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: '消息ID不能为空'
      });
    }
    
    const reply = await chatService.getRobotReply(userId, messageId);
    res.json({
      success: true,
      data: reply
    });
  } catch (error) {
    logger.error('获取机器人回复失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机器人回复失败'
    });
  }
};

// 评价聊天
exports.evaluateChat = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { score } = req.body;
    const userId = req.user._id;
    
    const chat = await Chat.findOne({
      _id: messageId,
      userId
    });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    chat.score = score;
    chat.evaluated = true;
    
    await chat.save();
    
    res.json({
      success: true,
      message: '评价成功'
    });
  } catch (error) {
    logger.error('评价聊天失败:', error);
    res.status(500).json({
      success: false,
      message: '评价聊天失败'
    });
  }
};

// 获取聊天积分
exports.getChatPoints = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    logger.info('获取聊天积分 - 参数:', { chatId, userId });

    // 查找消息
    const message = await Message.findOne({
      _id: chatId,
      userId
    });

    if (!message) {
      logger.warn('消息不存在:', { chatId, userId });
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    // 如果是用户消息，查找对应的机器人回复
    if (message.type === 'user') {
      const robotReply = await Message.findOne({
        userId,
        robotId: message.robotId,
        type: 'robot',
        createTime: { $gt: message.createTime }
      }).sort({ createTime: 1 });

      if (!robotReply) {
        logger.warn('未找到机器人回复:', { chatId, userId });
        return res.status(404).json({
          success: false,
          message: '未找到机器人回复'
        });
      }
    }

    // 计算积分（这里简单返回1分）
    const points = 1;

    // 更新用户积分
    await User.findByIdAndUpdate(userId, {
      $inc: { points: points }
    });

    logger.info('获取积分成功:', { chatId, userId, points });

    res.json({
      success: true,
      data: points
    });
  } catch (error) {
    logger.error('获取积分失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分失败'
    });
  }
};

// 获取对话详情
exports.getChatDetail = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
    const chat = await chatService.getChatDetail(chatId, userId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: '对话不存在'
      });
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    logger.error('获取对话详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取对话详情失败'
    });
  }
};

// 获取上下文
exports.getChatContext = async (req, res) => {
  try {
    const { robotId } = req.params;
    const userId = req.user._id;
    
    const chats = await Chat.find({
      userId,
      robotId
    }).sort({ createTime: -1 }).limit(10);
    
    // 添加 id 字段
    const formattedChats = chats.map(chat => ({
      _id: chat._id,
      id: chat._id,
      userId: chat.userId,
      robotId: chat.robotId,
      userMessage: chat.userMessage ? {
        _id: chat.userMessage._id,
        id: chat.userMessage._id,
        content: chat.userMessage.content
      } : null,
      robotReply: chat.robotReply ? {
        _id: chat.robotReply._id,
        id: chat.robotReply._id,
        content: chat.robotReply.content
      } : null,
      createdAt: chat.createdAt
    }));
    
    res.json({
      success: true,
      data: formattedChats
    });
  } catch (error) {
    logger.error('获取上下文失败:', error);
    res.status(500).json({
      success: false,
      message: '获取上下文失败',
      data: null
    });
  }
};

// 清除上下文
exports.clearChatContext = async (req, res) => {
  try {
    const { robotId } = req.params;
    const userId = req.user._id;
    
    await Chat.deleteMany({
      userId,
      robotId
    });
    
    res.json({
      success: true,
      message: '清除上下文成功'
    });
  } catch (error) {
    logger.error('清除上下文失败:', error);
    res.status(500).json({
      success: false,
      message: '清除上下文失败'
    });
  }
};

// 获取机器人配置
exports.getRobotConfig = async (req, res) => {
  try {
    const { robotId } = req.params;
    
    // TODO: 从数据库获取机器人配置
    const config = {
      name: '测试机器人',
      avatar: '/assets/images/logo.png',
      description: '这是一个测试机器人',
      personality: '友好、幽默'
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('获取机器人配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机器人配置失败'
    });
  }
};

// 更新机器人配置
exports.updateRobotConfig = async (req, res) => {
  try {
    const { robotId } = req.params;
    const config = req.body;
    
    // TODO: 更新数据库中的机器人配置
    
    res.json({
      success: true,
      message: '更新机器人配置成功'
    });
  } catch (error) {
    logger.error('更新机器人配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新机器人配置失败'
    });
  }
};
