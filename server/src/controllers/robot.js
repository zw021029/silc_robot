const robotService = require('../services/robot');
const logger = require('../utils/logger');

// 获取机器人列表
exports.getRobotList = async (req, res) => {
  try {
    const robots = await robotService.getRobotList();
    res.json({
      success: true,
      data: robots
    });
  } catch (error) {
    logger.error('获取机器人列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机器人列表失败'
    });
  }
};

// 获取机器人详情
exports.getRobotDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const robot = await robotService.getRobotDetail(id);
    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    logger.error('获取机器人详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机器人详情失败'
    });
  }
};

// 绑定机器人
exports.bindRobot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    logger.info('开始绑定机器人:', { userId, robotId: id });
    
    if (!id) {
      logger.warn('绑定机器人失败: 缺少robotId');
      return res.status(400).json({
        success: false,
        message: '请选择要绑定的机器人'
      });
    }
    
    if (!userId) {
      logger.warn('绑定机器人失败: 缺少userId');
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    const robot = await robotService.bindRobot(userId, id);
    logger.info('绑定机器人成功:', { userId, robotId: id, robot });
    
    res.json({
      success: true,
      message: '绑定机器人成功',
      data: robot
    });
  } catch (error) {
    logger.error('绑定机器人失败:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message === '机器人不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === '用户ID不能为空') {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '绑定机器人失败'
    });
  }
};

// 获取当前绑定的机器人
exports.getCurrentRobot = async (req, res) => {
  try {
    const userId = req.user._id;
    const robot = await robotService.getCurrentRobot(userId);
    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    logger.error('获取当前机器人失败:', error);
    res.status(500).json({
      success: false,
      message: '获取当前机器人失败'
    });
  }
};

// 解绑机器人
exports.unbindRobot = async (req, res) => {
  try {
    const userId = req.user._id;
    await robotService.unbindRobot(userId);
    res.json({
      success: true,
      message: '解绑机器人成功'
    });
  } catch (error) {
    logger.error('解绑机器人失败:', error);
    res.status(500).json({
      success: false,
      message: '解绑机器人失败'
    });
  }
};
