const logger = require('../utils/logger');
const PointsTransaction = require('../models/points');
const User = require('../models/user');
const mongoose = require('mongoose');

// 获取积分余额
exports.getPointsBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 从数据库获取用户积分
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 如果用户模型中没有points字段，初始化为0
    const balance = user.points || 0;
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    logger.error('获取积分余额失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分余额失败'
    });
  }
};

// 获取积分历史
exports.getPointsHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, pageSize = 20, type, startDate, endDate } = req.query;
    
    // 构建查询条件
    const query = { userId: mongoose.Types.ObjectId(userId) };
    
    // 按类型筛选
    if (type) {
      query.type = type;
    }
    
    // 按日期范围筛选
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // 查询总数
    const total = await PointsTransaction.countDocuments(query);
    
    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const transactions = await PointsTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
    
    // 格式化数据
    const history = transactions.map(item => ({
      id: item._id,
      type: item.type,
      amount: item.amount,
      balance: item.balance,
      description: item.description,
      createdAt: item.createdAt,
      sourceType: item.sourceType
    }));
    
    res.json({
      success: true,
      data: {
        list: history,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取积分历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分历史失败'
    });
  }
};

// 获取兑换商品列表
exports.getExchangeItems = async (req, res) => {
  try {
    // 从数据库获取兑换商品列表
    const items = [
      {
        id: 1,
        name: '思意AI月卡',
        points: 500,
        description: '畅享思意AI高级功能一个月',
        image: '/assets/images/items/monthly-card.png',
        stock: 100
      },
      {
        id: 2,
        name: 'AI个性化形象定制',
        points: 1000,
        description: '专业AI定制专属于您的个性化形象',
        image: '/assets/images/items/avatar-customize.png',
        stock: 50
      },
      {
        id: 3,
        name: '思意AI知识库定制',
        points: 2000,
        description: '根据您的需求定制专属知识库',
        image: '/assets/images/items/knowledge-base.png',
        stock: 30
      },
      {
        id: 4,
        name: '思意AI年度会员',
        points: 5000,
        description: '全年畅享思意AI高级功能',
        image: '/assets/images/items/annual-member.png',
        stock: 20
      }
    ];
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('获取兑换商品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取兑换商品列表失败'
    });
  }
};

// 获取积分规则
exports.getPointsRules = async (req, res) => {
  try {
    // 从数据库获取积分规则
    const rules = [
      {
        id: 1,
        title: '每日签到',
        points: 10,
        description: '每日签到可获得10积分，连续签到额外奖励'
      },
      {
        id: 2,
        title: '聊天奖励',
        points: 2,
        description: '每次与思意AI对话可获得2积分（每日上限30分）'
      },
      {
        id: 3,
        title: '分享思意',
        points: 20,
        description: '分享思意给好友，好友使用后您可获得20积分'
      },
      {
        id: 4,
        title: '评价机器人回复',
        points: 5,
        description: '对机器人回复进行评价获得5积分（每日上限20分）'
      },
      {
        id: 5,
        title: '完成新手任务',
        points: 50,
        description: '完成所有新手任务一次性奖励50积分'
      }
    ];
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('获取积分规则失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分规则失败'
    });
  }
};

// 兑换商品
exports.exchangeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空'
      });
    }

    // 获取商品信息
    const items = await exports.getExchangeItems();
    const item = items.data.find(i => i.id === parseInt(itemId));
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 检查库存
    if (item.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 检查用户积分是否足够
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const userPoints = user.points || 0;
    if (userPoints < item.points) {
      return res.status(400).json({
        success: false,
        message: '积分不足'
      });
    }

    // 扣除积分
    user.points = userPoints - item.points;
    await user.save();

    // 记录交易
    const transaction = new PointsTransaction({
      userId,
      type: 'spend',
      amount: -item.points,
      balance: user.points,
      sourceType: 'other',
      description: `兑换商品: ${item.name}`,
      metadata: { itemId: item.id }
    });
    await transaction.save();

    // TODO: 处理商品兑换逻辑，如发放优惠券等

    res.json({
      success: true,
      message: '兑换成功',
      data: {
        balance: user.points,
        item: item.name
      }
    });
  } catch (error) {
    logger.error('商品兑换失败:', error);
    res.status(500).json({
      success: false,
      message: '商品兑换失败'
    });
  }
};

// 获取积分统计
exports.getPointsStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 获取用户总积分
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const totalPoints = user.points || 0;
    
    // 获取本月获得的积分
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyEarned = await PointsTransaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'earn',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 获取已使用的积分
    const usedPoints = await PointsTransaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'spend'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalPoints,
        monthPoints: monthlyEarned.length > 0 ? Math.abs(monthlyEarned[0].total) : 0,
        usedPoints: usedPoints.length > 0 ? Math.abs(usedPoints[0].total) : 0
      }
    });
  } catch (error) {
    logger.error('获取积分统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分统计失败'
    });
  }
};
