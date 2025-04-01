const Message = require('../models/message');
const User = require('../models/user');
const Robot = require('../models/robot');
const logger = require('../utils/logger');

// 获取历史记录列表
exports.getHistoryList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, pageSize = 20, keyword = '' } = req.query;
    
    logger.info('获取历史记录列表', { userId, page, pageSize, keyword });
    
    // 构建查询条件
    const query = { 
      userId,
      type: 'user'  // 只获取用户发送的消息
    };
    
    // 如果有关键词，添加内容搜索条件
    if (keyword) {
      query.content = { $regex: keyword, $options: 'i' };
    }
    
    // 计算总数
    const total = await Message.countDocuments(query);
    
    // 分页查询
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
      
    // 处理结果
    const historyList = [];
    
    for (const userMessage of messages) {
      // 查找对应的机器人回复
      const robotReply = await Message.findOne({
        chatId: userMessage.chatId,
        type: 'robot',
        createdAt: { $gt: userMessage.createdAt }
      }).sort({ createdAt: 1 });
      
      // 查找机器人信息 - 使用name字段查询而不是_id
      const robot = await Robot.findOne({ name: userMessage.robotId });
      
      // 添加格式化时间
      const formattedTime = new Date(userMessage.createdAt).toLocaleString();
      
      historyList.push({
        _id: userMessage._id,
        content: userMessage.content,
        question: userMessage.content,
        answer: robotReply ? robotReply.content : '暂无回复',
        robotId: userMessage.robotId,
        robotName: robot ? robot.name : userMessage.robotId, // 如果找不到机器人信息，使用robotId作为名称
        score: robotReply ? robotReply.score : null,
        points: 1,  // 默认积分值，可以根据实际情况调整
        createdAt: userMessage.createdAt,
        formattedTime: formattedTime,
        evaluated: robotReply ? robotReply.evaluated : false
      });
    }
    
    // 统计今日消息数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = await Message.countDocuments({
      userId,
      type: 'user',
      createdAt: { $gte: today }
    });
    
    res.json({
      success: true,
      data: {
        list: historyList,
        stats: {
          total,
          today: todayMessages
        },
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      }
    });
    
  } catch (error) {
    logger.error('获取历史记录失败', error);
    res.status(500).json({
      success: false,
      error: '获取历史记录失败'
    });
  }
};

// 获取历史记录详情
exports.getHistoryDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    // 查找用户消息
    const userMessage = await Message.findOne({ 
      _id: id,
      userId
    });
    
    if (!userMessage) {
      return res.status(404).json({
        success: false,
        error: '历史记录不存在'
      });
    }
    
    // 查找对应的机器人回复
    const robotReply = await Message.findOne({
      chatId: userMessage.chatId,
      type: 'robot',
      createdAt: { $gt: userMessage.createdAt }
    }).sort({ createdAt: 1 });
    
    // 查找机器人信息 - 使用name字段查询而不是_id
    const robot = await Robot.findOne({ name: userMessage.robotId });
    
    // 添加格式化时间
    const formattedTime = new Date(userMessage.createdAt).toLocaleString();
    
    res.json({
      success: true,
      data: {
        _id: userMessage._id,
        question: userMessage.content,
        answer: robotReply ? robotReply.content : '暂无回复',
        robotId: userMessage.robotId,
        robotName: robot ? robot.name : userMessage.robotId,
        score: robotReply ? robotReply.score : null,
        createdAt: userMessage.createdAt,
        formattedTime: formattedTime,
        evaluated: robotReply ? robotReply.evaluated : false
      }
    });
    
  } catch (error) {
    logger.error('获取历史记录详情失败', error);
    res.status(500).json({
      success: false,
      error: '获取历史记录详情失败'
    });
  }
};

// 删除历史记录
exports.deleteHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    // 查找并删除用户消息
    const userMessage = await Message.findOneAndDelete({
      _id: id,
      userId
    });
    
    if (!userMessage) {
      return res.status(404).json({
        success: false,
        error: '历史记录不存在'
      });
    }
    
    // 删除对应的机器人回复
    await Message.deleteMany({
      chatId: userMessage.chatId,
      type: 'robot',
      createdAt: { $gt: userMessage.createdAt }
    });
    
    res.json({
      success: true,
      message: '删除成功'
    });
    
  } catch (error) {
    logger.error('删除历史记录失败', error);
    res.status(500).json({
      success: false,
      error: '删除历史记录失败'
    });
  }
};

// 获取历史记录统计
exports.getHistoryStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 计算总数
    const total = await Message.countDocuments({
      userId,
      type: 'user'
    });
    
    // 统计今日消息数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = await Message.countDocuments({
      userId,
      type: 'user',
      createdAt: { $gte: today }
    });
    
    res.json({
      success: true,
      data: {
        total,
        today: todayMessages
      }
    });
    
  } catch (error) {
    logger.error('获取历史记录统计失败', error);
    res.status(500).json({
      success: false,
      error: '获取历史记录统计失败'
    });
  }
}; 