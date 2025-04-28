const logger = require('../utils/logger');
const PointsTransaction = require('../models/points');
const User = require('../models/user');
const mongoose = require('mongoose');
const { pgPool } = require('../utils/database');

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
    const client = await pgPool.connect();
    const result = await client.query('SELECT * FROM exchange_items ORDER BY id');
    logger.info('result', result);
    client.release();
    
    res.json({
      success: true,
      data: result.rows
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
        title: '聊天奖励',
        points: 1,
        description: '每次与思意AI对话可获得1积分'
      },
      {
        id: 2,
        title: '问题反馈',
        points: 2,
        description: '反馈问题可获得2积分'
      },
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
    const client = await pgPool.connect();
    const result = await client.query('SELECT * FROM exchange_items WHERE id = $1', [itemId]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    const item = result.rows[0];

    // 检查库存
    if (item.stock <= 0) {
      client.release();
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 检查用户积分是否足够
    const user = await User.findById(userId);
    if (!user) {
      client.release();
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const userPoints = user.points || 0;
    if (userPoints < item.points) {
      client.release();
      return res.status(400).json({
        success: false,
        message: '积分不足'
      });
    }

    // 生成订单号和兑换码
    const orderNo = `EX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const redeemCode = `RC${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 开始事务
    await client.query('BEGIN');

    try {
      // 扣除积分
      user.points = userPoints - item.points;
      await user.save();

      // 记录积分变化
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

      // 创建兑换记录
      await client.query(
        'INSERT INTO exchange_records (order_no, user_id, item_id, redeem_code) VALUES ($1, $2, $3, $4)',
        [orderNo, userId, itemId, redeemCode]
      );

      // 更新商品库存
      await client.query('UPDATE exchange_items SET stock = stock - 1 WHERE id = $1', [itemId]);

      // 提交事务
      await client.query('COMMIT');

      res.json({
        success: true,
        message: '兑换成功',
        data: {
          balance: user.points,
          item: item.name,
          redeemCode: redeemCode
        }
      });
    } catch (error) {
      // 回滚事务
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('商品兑换失败:', error);
    res.status(500).json({
      success: false,
      message: '商品兑换失败'
    });
  }
};

// 获取兑换记录
exports.getExchangeRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const client = await pgPool.connect();
    
    // 获取总记录数
    const countResult = await client.query(
      'SELECT COUNT(*) FROM exchange_records WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取记录列表
    const result = await client.query(`
      SELECT r.*, i.name as item_name, i.image as item_image
      FROM exchange_records r
      JOIN exchange_items i ON r.item_id = i.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, pageSize, offset]);

    client.release();

    const records = result.rows.map(record => ({
      id: record.id,
      orderNo: record.order_no,
      itemName: record.item_name,
      itemImage: record.item_image,
      redeemCode: record.redeem_code,
      createdAt: record.created_at,
      isRedeemed: record.is_redeemed,
      redeemedAt: record.redeemed_at
    }));

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取兑换记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取兑换记录失败'
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
