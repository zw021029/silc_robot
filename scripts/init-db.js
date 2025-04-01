const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 导入模型
const User = require('../server/src/models/user');
const Robot = require('../server/src/models/robot');
const { Reward } = require('../server/src/models/reward');
const { KnowledgeCategory } = require('../server/src/models/knowledge');

// 数据库连接URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/silc_qa';

// 连接数据库
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB连接成功，开始初始化数据...'))
  .catch(err => {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
  });

// 初始化用户数据
const initUsers = async () => {
  try {
    // 清空集合
    await User.deleteMany({});
    console.log('已清空用户集合');

    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: adminPassword,
      nickname: '管理员',
      phone: '13800000000',
      role: 'admin',
      points: 1000,
      selectedRobot: 'xiwen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginTime: new Date()
    });

    // 创建测试用户
    const testPassword = await bcrypt.hash('123456', 10);
    const testUser = new User({
      username: 'test',
      password: testPassword,
      nickname: '测试用户',
      phone: '13900000000',
      role: 'user',
      points: 100,
      selectedRobot: 'xiwen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginTime: new Date()
    });

    await Promise.all([admin.save(), testUser.save()]);
    console.log('用户数据初始化成功');
  } catch (error) {
    console.error('初始化用户数据失败:', error);
  }
};

// 初始化机器人数据
const initRobots = async () => {
  try {
    // 清空集合
    await Robot.deleteMany({});
    console.log('已清空机器人集合');

    // 创建机器人
    const xiwen = new Robot({
      id: 'xiwen',
      name: '悉问',
      description: '悉商学院知识库问答助手，可以回答学院相关的各种问题',
      avatar: '/assets/robots/xiwen.png',
      model: 'gpt-3.5-turbo',
      systemPrompt: '你是悉商商学院的智能助手，请耐心回答用户的问题。',
      temperature: 0.7,
      maxTokens: 2000,
      status: 'active',
      pointsPerInteraction: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const xihui = new Robot({
      id: 'xihui',
      name: '悉慧',
      description: '悉商学院智能学习规划师，帮助学生做好学习规划和职业规划',
      avatar: '/assets/robots/xihui.png',
      model: 'gpt-4',
      systemPrompt: '你是悉商商学院的学习规划师，请根据用户的情况提供专业的学习和职业规划建议。',
      temperature: 0.5,
      maxTokens: 3000,
      status: 'active',
      pointsPerInteraction: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await Promise.all([xiwen.save(), xihui.save()]);
    console.log('机器人数据初始化成功');
  } catch (error) {
    console.error('初始化机器人数据失败:', error);
  }
};

// 初始化奖励数据
const initRewards = async () => {
  try {
    // 清空集合
    await Reward.deleteMany({});
    console.log('已清空奖励集合');

    // 创建奖励
    const rewards = [
      {
        name: '每日签到',
        type: 'daily_login',
        points: 5,
        description: '每日登录可获得5积分',
        condition: {
          frequency: 'daily',
          maxCount: 1
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '完成对话',
        type: 'chat_completion',
        points: 1,
        description: '每次完成对话可获得1积分',
        condition: {
          frequency: 'unlimited'
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '分享应用',
        type: 'share',
        points: 10,
        description: '分享小程序给好友可获得10积分',
        condition: {
          frequency: 'daily',
          maxCount: 3
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await Reward.insertMany(rewards);
    console.log('奖励数据初始化成功');
  } catch (error) {
    console.error('初始化奖励数据失败:', error);
  }
};

// 初始化知识库分类
const initKnowledgeCategories = async () => {
  try {
    // 清空集合
    await KnowledgeCategory.deleteMany({});
    console.log('已清空知识库分类集合');

    // 创建分类
    const categories = [
      {
        name: '学院简介',
        description: '关于悉商学院的基本介绍',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '课程信息',
        description: '学院提供的课程相关信息',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '师资力量',
        description: '关于学院教师和导师的信息',
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '学生服务',
        description: '为学生提供的各种服务信息',
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '常见问题',
        description: '学生经常咨询的问题及解答',
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await KnowledgeCategory.insertMany(categories);
    console.log('知识库分类数据初始化成功');
  } catch (error) {
    console.error('初始化知识库分类数据失败:', error);
  }
};

// 执行所有初始化函数
const initAll = async () => {
  try {
    await initUsers();
    await initRobots();
    await initRewards();
    await initKnowledgeCategories();
    
    console.log('所有数据初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据初始化过程中出错:', error);
    process.exit(1);
  }
};

// 运行初始化
initAll();