const User = require('../models/user');
const logger = require('../utils/logger');

class RobotService {
  async getRobotList() {
    try {
      // 返回默认的机器人列表
      return [
        {
          _id: 'xiwen',
          name: '悉文',
          avatar: '/assets/images/xiwen.png',
          description: '专业、理性的男性机器人助手',
          type: 'male'
        },
        {
          _id: 'xihui',
          name: '悉荟',
          avatar: '/assets/images/xihui.png',
          description: '温柔、感性的女性机器人助手',
          type: 'female'
        }
      ];
    } catch (error) {
      logger.error('获取机器人列表失败:', error);
      throw error;
    }
  }

  async getRobotDetail(robotId) {
    try {
      logger.info('获取机器人详情:', { robotId });
      
      if (!robotId) {
        logger.warn('获取机器人详情失败: 缺少robotId');
        throw new Error('机器人ID不能为空');
      }

      const robots = await this.getRobotList();
      const robot = robots.find(r => r._id === robotId || r.id === robotId);
      
      if (!robot) {
        logger.warn('获取机器人详情失败: 机器人不存在', { robotId });
        throw new Error('机器人不存在');
      }

      // 确保返回的机器人对象有_id字段
      return {
        ...robot,
        _id: robot._id || robot.id
      };
    } catch (error) {
      logger.error('获取机器人详情失败:', error);
      throw error;
    }
  }

  async bindRobot(userId, robotId) {
    try {
      logger.info('开始绑定机器人:', { userId, robotId });

      if (!userId) {
        logger.warn('绑定机器人失败: 缺少userId');
        throw new Error('用户ID不能为空');
      }

      if (!robotId) {
        logger.warn('绑定机器人失败: 缺少robotId');
        throw new Error('机器人ID不能为空');
      }

      const robot = await this.getRobotDetail(robotId);
      if (!robot) {
        logger.warn('绑定机器人失败: 机器人不存在', { robotId });
        throw new Error('机器人不存在');
      }

      await User.findByIdAndUpdate(userId, { 
        selectedRobot: robot._id || robot.id,
        lastUpdated: new Date()
      });

      logger.info('绑定机器人成功:', { userId, robotId });
      return robot;
    } catch (error) {
      logger.error('绑定机器人失败:', error);
      throw error;
    }
  }

  async getCurrentRobot(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.selectedRobot) {
        return null;
      }
      return this.getRobotDetail(user.selectedRobot);
    } catch (error) {
      logger.error('获取当前机器人失败:', error);
      throw error;
    }
  }

  async unbindRobot(userId) {
    try {
      await User.findByIdAndUpdate(userId, { selectedRobot: null });
      return true;
    } catch (error) {
      logger.error('解绑机器人失败:', error);
      throw error;
    }
  }
}

module.exports = new RobotService();
