const mongoose = require('mongoose');
const chatService = require('../services/chat');
const logger = require('../utils/logger');
const config = require('../config');

// 测试数据
const testCases = [
  {
    userId: 'test_user_1',
    robotId: 'xiwen',
    messages: [
      '你好',
      '介绍一下你自己',
      '今天天气怎么样',
      '如何学习编程'
    ]
  },
  {
    userId: 'test_user_2',
    robotId: 'xihui',
    messages: [
      '你好',
      '介绍一下你自己',
      '今天天气怎么样',
      '如何学习编程'
    ]
  }
];

// 测试对话功能
async function testChat() {
  try {
    // 连接数据库
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('数据库连接成功');

    // 测试每个用例
    for (const testCase of testCases) {
      logger.info(`开始测试用户 ${testCase.userId} 与机器人 ${testCase.robotId} 的对话`);

      for (const message of testCase.messages) {
        try {
          // 保存用户消息
          const userMessage = await chatService.saveMessage(
            testCase.userId,
            testCase.robotId,
            message
          );

          // 获取机器人回复
          const reply = await chatService.getRobotReply(
            testCase.userId,
            userMessage._id
          );

          logger.info('测试结果:', {
            userId: testCase.userId,
            robotId: testCase.robotId,
            userMessage: message,
            robotReply: reply
          });
        } catch (error) {
          logger.error('测试消息失败:', {
            userId: testCase.userId,
            robotId: testCase.robotId,
            message,
            error
          });
        }
      }
    }

    logger.info('测试完成');
    process.exit(0);
  } catch (error) {
    logger.error('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testChat(); 