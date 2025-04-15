const mongoose = require('mongoose');
const config = require('../config');
const Robot = require('../models/robot');
const logger = require('../utils/logger');

const defaultRobots = [
  {
    name: '悉文',
    description: '悉商商学院的智能助手，擅长回答商业相关问题',
    avatar: 'https://example.com/xiwen-avatar.png',
    type: 'female',
    model: 'gpt-3.5-turbo',
    systemPrompt: '你是悉商商学院的智能助手，请耐心回答用户的问题。',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0.6,
    voiceSettings: {
      enabled: false,
      voiceId: 'cmn-CN-YunxiNeural',
      speed: 1.0
    },
    imageSettings: {
      enabled: false,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png']
    },
    pointsPerInteraction: 1,
    isActive: true
  },
  {
    name: '悉荟',
    description: '悉商商学院的智能顾问，擅长专业咨询',
    avatar: 'https://example.com/xihui-avatar.png',
    type: 'male',
    model: 'gpt-3.5-turbo',
    systemPrompt: '你是悉商商学院的智能顾问，请专业地回答用户的问题。',
    temperature: 0.5,
    maxTokens: 2000,
    topP: 0.8,
    frequencyPenalty: 0,
    presencePenalty: 0.6,
    voiceSettings: {
      enabled: false,
      voiceId: 'cmn-CN-YunxiNeural',
      speed: 1.0
    },
    imageSettings: {
      enabled: false,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png']
    },
    pointsPerInteraction: 2,
    isActive: true
  }
];

async function initData() {
  try {
    // 连接数据库
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('数据库连接成功');

    // 清空现有机器人数据
    await Robot.deleteMany({});
    logger.info('已清空现有机器人数据');

    // 插入默认机器人数据
    const robots = await Robot.insertMany(defaultRobots);
    logger.info(`成功插入 ${robots.length} 个默认机器人`);

    // 关闭数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');

    process.exit(0);
  } catch (error) {
    logger.error('初始化数据失败:', error);
    process.exit(1);
  }
}

initData(); 