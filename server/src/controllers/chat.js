const chatService = require('../services/chat');
const logger = require('../utils/logger');
const Message = require('../models/message');
const User = require('../models/user');
const { unauthorized } = require('../utils/response');
const Robot = require('../models/robot');
const Chat = require('../models/chat');
const AppError = require('../utils/appError');
const {
  getRobotReply,
  calculateChatPoints,
  getRobotDetails,
  adjustReplyStyle
} = require('../services/chat');
const PointsTransaction = require('../models/points');
const mongoose = require('mongoose');

// 获取聊天历史
exports.getChatHistory = async (req, res, next) => {
  try {
    // 调试输出
    console.log('获取聊天历史API请求: 用户ID =', req.user ? req.user.id : '未知', '机器人ID =', req.params.robotId);

    const userId = req.user.id;
    const robotId = req.params.robotId;

    if (!userId) {
      return next(new AppError('用户ID不能为空', 400));
    }

    if (!robotId) {
      return next(new AppError('机器人ID不能为空', 400));
    }

    // 查询用户和机器人
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 查找所有相关的聊天记录
    const chats = await Chat.find({
      userId,
      robotId
    }).sort({ createdAt: -1 });

    // 获取所有消息ID
    const messageIds = chats.reduce((ids, chat) => {
      if (chat.userMessage) ids.push(chat.userMessage);
      if (chat.robotReply) ids.push(chat.robotReply);
      return ids;
    }, []);

    // 获取所有消息
    const messages = await Message.find({
      _id: { $in: messageIds }
    });

    // 将消息按聊天记录组织
    const chatHistory = chats.map(chat => {
      const userMsg = messages.find(msg =>
        msg._id.toString() === chat.userMessage?.toString()
      );

      const robotMsg = messages.find(msg =>
        msg._id.toString() === chat.robotReply?.toString()
      );

      return {
        id: chat._id,
        time: chat.createdAt,
        userMessage: userMsg ? {
          id: userMsg._id,
          content: userMsg.content,
          type: userMsg.contentType,
          time: userMsg.createdAt
        } : null,
        robotReply: robotMsg ? {
          id: robotMsg._id,
          content: robotMsg.content,
          type: robotMsg.contentType,
          time: robotMsg.createdAt
        } : null
      };
    });

    // 也可以直接获取所有消息记录
    const allMessages = await Message.find({
      userId,
      robotId
    }).sort({ createdAt: 1 });

    // 将消息格式化为前端需要的格式
    const messageHistory = allMessages.map(msg => ({
      id: msg._id,
      _id: msg._id,
      content: msg.content,
      type: msg.type, // 'user' 或 'robot'
      contentType: msg.contentType, // 'text', 'image' 等
      time: msg.createdAt,
      createdAt: msg.createdAt,
      isUser: msg.type === 'user'
    }));

    console.log(`成功获取聊天历史: 找到 ${messageHistory.length} 条消息`);

    res.status(200).json({
      success: true,
      data: {
        chats: chatHistory,
        messages: messageHistory
      }
    });
  } catch (error) {
    console.error('获取聊天历史出错:', error);
    next(error);
  }
};

// 发送消息
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content, robotId } = req.body;

    // 开始事务
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 创建聊天记录
      let chat = new Chat({
        userId,
        robotId
      });
      await chat.save();

      // 创建用户消息记录
      const userMessage = new Message({
        userId,
        robotId,
        chatId: chat._id,
        content,
        type: 'user',
        contentType: 'text'
      });
      await userMessage.save();

      // 更新聊天记录
      chat.userMessage = userMessage._id;
      await chat.save();

      // 获取机器人回复
      let robotReplyContent = '';
      let replyKnowledgeId = null;

      try {
        const robotReply = await getRobotReply(userId, content);
        robotReplyContent = robotReply.content;
        replyKnowledgeId = robotReply._id;
      } catch (error) {
        logger.error('获取机器人回复失败:', error);
        robotReplyContent = '抱歉，我暂时无法回应，请稍后再试。';
      }

      // 创建机器人回复消息
      const robotMessage = new Message({
        userId,
        robotId,
        chatId: chat._id,
        content: robotReplyContent,
        type: 'robot',
        contentType: 'text',
        knowledgeId: replyKnowledgeId
      });
      await robotMessage.save();

      // 更新聊天记录
      chat.robotReply = robotMessage._id;
      await chat.save();

      // 检查今日聊天积分是否达到上限
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayChatCount = await PointsTransaction.countDocuments({
        userId: mongoose.Types.ObjectId(userId),
        type: 'earn',
        sourceType: 'chat',
        createdAt: { $gte: today }
      });

      let pointsEarned = 0;
      let newPoints = 0;

      // 如果未达到积分上限，则添加积分
      if (todayChatCount < 10) {
        // 获取用户信息
        const user = await User.findById(userId);
        if (!user) {
          throw new Error('用户不存在');
        }

        // 更新用户积分
        newPoints = (user.points || 0) + 1;
        await User.findByIdAndUpdate(userId, { points: newPoints });

        // 创建积分交易记录
        const pointsTransaction = new PointsTransaction({
          userId,
          type: 'earn',
          amount: 1,
          balance: newPoints,
          sourceType: 'chat',
          sourceId: userMessage._id,
          sourceModel: 'ChatMessage',
          description: '聊天获得1积分'
        });
        await pointsTransaction.save();

        pointsEarned = 1;
      }

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        data: {
          userMessage: {
            id: userMessage._id,
            content: userMessage.content,
            type: userMessage.type,
            time: userMessage.createdAt
          },
          robotReply: {
            id: robotMessage._id,
            content: robotMessage.content,
            type: robotMessage.type,
            time: robotMessage.createdAt
          },
          points: {
            earned: pointsEarned,
            total: newPoints || (await User.findById(userId)).points || 0
          }
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
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
exports.getChatPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;

    logger.info('开始获取聊天积分', {
      userId,
      messageId
    });

    // 参数验证
    if (!messageId) {
      return next(new AppError('消息ID不能为空', 400));
    }

    // 获取消息
    const message = await Message.findOne({
      _id: messageId,
      userId
    });

    if (!message) {
      return next(new AppError('消息不存在', 404));
    }

    // 获取积分
    let points = 0;

    try {
      // 获取机器人详情
      logger.info('获取机器人详情:', {
        robotId: message.robotId
      });

      let robot;
      try {
        robot = await getRobotDetails(message.robotId);
        points = await calculateChatPoints(message, robot);
      } catch (error) {
        logger.error('获取机器人详情失败:', error);
        logger.warn('获取机器人信息失败，使用默认配置', {
          robotId: message.robotId,
          error: error.message
        });

        // 使用默认配置计算积分
        points = await calculateChatPoints(message);
      }
    } catch (error) {
      logger.error('计算积分失败:', error);
      points = 1; // 默认给1分
    }

    // 更新用户积分
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 更新积分
    const totalPoints = (user.points || 0) + points;

    // 创建积分记录
    const pointsTransaction = new PointsTransaction({
      userId: userId,
      type: 'earn',
      amount: points,
      balance: totalPoints,
      sourceType: 'chat',
      sourceId: message._id,
      sourceModel: 'ChatMessage',
      description: `完成对话获得${points}积分`
    });

    await pointsTransaction.save();

    // 更新用户积分
    await User.findByIdAndUpdate(userId, {
      points: totalPoints,
      updatedAt: new Date()
    });

    logger.info('获取聊天积分成功', {
      points: {
        points,
        totalPoints
      },
      transactionId: pointsTransaction._id.toString()
    });

    res.status(200).json({
      success: true,
      data: {
        points,
        totalPoints
      }
    });
  } catch (error) {
    next(error);
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

// 获取机器人列表
exports.getRobots = async (req, res, next) => {
  try {
    const robots = await Robot.find({ status: 'active' });

    // 获取用户选择的机器人
    const userId = req.user.id;
    const user = await User.findById(userId);

    const robotsData = robots.map(robot => ({
      id: robot._id,
      name: robot.name,
      displayName: robot.displayName,
      description: robot.description,
      avatar: robot.avatar,
      features: robot.features,
      selected: user && user.selectedRobot ?
        user.selectedRobot.toString() === robot._id.toString() :
        false
    }));

    res.status(200).json({
      success: true,
      data: robotsData
    });
  } catch (error) {
    next(error);
  }
};

// 选择机器人
exports.selectRobot = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { robotId } = req.body;

    // 参数验证
    if (!robotId) {
      return next(new AppError('机器人ID不能为空', 400));
    }

    // 查询机器人
    let robot;
    try {
      robot = await getRobotDetails(robotId);
    } catch (error) {
      return next(new AppError('未找到该机器人', 404));
    }

    // 更新用户选择的机器人
    await User.findByIdAndUpdate(userId, {
      selectedRobot: robot._id,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `已选择机器人 ${robot.name}`,
      data: {
        id: robot._id,
        name: robot.name,
        displayName: robot.displayName,
        description: robot.description,
        avatar: robot.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};
