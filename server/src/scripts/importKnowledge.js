const mongoose = require('mongoose');
const { Knowledge } = require('../models/knowledge');
const { getEmbedding } = require('../utils/embedding');
const logger = require('../utils/logger');
const config = require('../config');

// 设置 mongoose 选项
mongoose.set('strictQuery', false);
mongoose.set('debug', true);

// 示例问答对数据
const knowledgeData = [
  // 问候语
  {
    title: '你好',
    content: '俺在呢，有啥事问一下？',
    robotId: 'xiwen',
    category: 'greeting'
  },
  {
    title: '你好',
    content: '亲，人家在这儿呢~有什么可以帮你的吗？',
    robotId: 'xihui',
    category: 'greeting'
  },
  {
    title: '早上好',
    content: '早上好！今天也要元气满满哦！',
    robotId: 'xiwen',
    category: 'greeting'
  },
  {
    title: '早上好',
    content: '早上好呀~今天也要开开心心的哦~',
    robotId: 'xihui',
    category: 'greeting'
  },
  {
    title: '晚上好',
    content: '晚上好！今天过得怎么样？',
    robotId: 'xiwen',
    category: 'greeting'
  },
  {
    title: '晚上好',
    content: '晚上好呢~今天过得开心吗？',
    robotId: 'xihui',
    category: 'greeting'
  },

  // 自我介绍
  {
    title: '介绍一下你自己',
    content: '俺是悉文，一个直来直去的AI助手，有啥问题尽管问！',
    robotId: 'xiwen',
    category: 'self-intro'
  },
  {
    title: '介绍一下你自己',
    content: '人家是悉慧，一个温柔可爱的AI助手，有什么问题都可以问我哦~',
    robotId: 'xihui',
    category: 'self-intro'
  },

  // 功能说明
  {
    title: '你能做什么',
    content: '俺能回答你的问题，陪你聊天，还能给你讲笑话！',
    robotId: 'xiwen',
    category: 'capability'
  },
  {
    title: '你能做什么',
    content: '我可以回答你的问题，陪你聊天，给你讲笑话，还可以给你一些建议哦~',
    robotId: 'xihui',
    category: 'capability'
  },

  // 情感互动
  {
    title: '我心情不好',
    content: '别难过，俺陪你聊聊天，说说看发生什么事了？',
    robotId: 'xiwen',
    category: 'emotion'
  },
  {
    title: '我心情不好',
    content: '别难过，来和我说说发生了什么，我会一直陪着你~',
    robotId: 'xihui',
    category: 'emotion'
  }
];

// 导入问答对数据
async function importKnowledge() {
  let connection;
  try {
    // 连接数据库
    const dbUrl = config.database.url;
    const dbOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };
    
    logger.info('正在连接数据库...', { 
      url: dbUrl,
      options: dbOptions
    });

    connection = await mongoose.connect(dbUrl, dbOptions);
    logger.info('数据库连接成功');

    // 清空现有数据
    logger.info('正在清空现有问答数据...');
    await Knowledge.deleteMany({});
    logger.info('现有数据清空完成');

    // 导入新数据
    logger.info('开始导入新的问答数据...');
    let successCount = 0;
    let failureCount = 0;

    for (const item of knowledgeData) {
      try {
        // 获取问题的向量表示
        const vector = await getEmbedding(item.title);
        if (!vector) {
          logger.error('获取向量表示失败', { 
            question: item.title,
            robotId: item.robotId
          });
          failureCount++;
          continue;
        }

        // 创建知识库条目
        const knowledge = new Knowledge({
          title: item.title,
          content: item.content,
          robotId: item.robotId,
          category: item.category,
          vector: vector,
          embeddings: true,
          status: 'active'
        });

        // 保存到数据库
        await knowledge.save();
        logger.info('导入问答对成功', { 
          question: item.title,
          robotId: item.robotId,
          knowledgeId: knowledge._id
        });
        successCount++;
      } catch (error) {
        logger.error('导入问答对失败:', error, { 
          question: item.title,
          robotId: item.robotId
        });
        failureCount++;
      }
    }

    logger.info('知识库导入完成', {
      total: knowledgeData.length,
      success: successCount,
      failure: failureCount
    });

    // 验证导入结果
    const count = await Knowledge.countDocuments();
    logger.info('知识库数据统计', { count });

    process.exit(0);
  } catch (error) {
    logger.error('导入知识库失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (connection) {
      try {
        await connection.disconnect();
        logger.info('数据库连接已关闭');
      } catch (error) {
        logger.error('关闭数据库连接失败:', error);
      }
    }
  }
}

// 运行导入脚本
importKnowledge(); 