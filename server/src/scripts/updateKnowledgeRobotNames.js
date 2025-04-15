const mongoose = require('mongoose');
const config = require('../config');
const { KnowledgeArticle } = require('../models/knowledge');
const logger = require('../utils/logger');

async function updateKnowledgeRobotNames() {
  try {
    // 连接数据库
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('数据库连接成功');

    // 删除所有现有的对话类知识库文章
    await KnowledgeArticle.deleteMany({ category: '对话' });
    logger.info('已删除现有对话类知识库文章');

    // 创建共享的知识库数据
    const sharedContent = [
      {
        title: '问候语',
        content: '俺在呢，有啥事问一下？',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '问候语',
        content: '亲，人家在这儿呢~有什么可以帮你的吗？',
        robotName: '悉慧',
        category: '对话',
        status: 'active'
      },
      {
        title: '早安问候',
        content: '早上好！今天也要元气满满哦！',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '早安问候',
        content: '早上好呀~今天也要开开心心的哦~',
        robotName: '悉慧',
        category: '对话',
        status: 'active'
      },
      {
        title: '晚安问候',
        content: '晚上好！今天过得怎么样？',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '晚安问候',
        content: '晚上好呢~今天过得开心吗？',
        robotName: '悉慧',
        category: '对话',
        status: 'active'
      },
      {
        title: '自我介绍',
        content: '俺是悉文，一个直来直去的AI助手，有啥问题尽管问！',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '自我介绍',
        content: '人家是悉荟，一个温柔可爱的AI助手，有什么问题都可以问我哦~',
        robotName: '悉荟',
        category: '对话',
        status: 'active'
      },
      {
        title: '功能介绍',
        content: '俺能回答你的问题，陪你聊天，还能给你讲笑话！',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '功能介绍',
        content: '我可以回答你的问题，陪你聊天，给你讲笑话，还可以给你一些建议哦~',
        robotName: '悉荟',
        category: '对话',
        status: 'active'
      },
      {
        title: '安慰语',
        content: '别难过，俺陪你聊聊天，说说看发生什么事了？',
        robotName: '悉文',
        category: '对话',
        status: 'active'
      },
      {
        title: '安慰语',
        content: '别难过，来和我说说发生了什么，我会一直陪着你~',
        robotName: '悉荟',
        category: '对话',
        status: 'active'
      }
    ];

    for (const articleData of sharedContent) {
      try {
        const article = new KnowledgeArticle(articleData);
        await article.save();
        logger.info(`创建内容成功: ${articleData.title} - ${articleData.robotName}`);
      } catch (error) {
        logger.error(`创建内容失败: ${articleData.title} - ${articleData.robotName}, 错误: ${error.message}`);
      }
    }

    logger.info('知识库数据更新完成');

    // 更新知识库数据
    await KnowledgeArticle.updateMany(
      { robotName: 'xihui' },
      { $set: { robotName: '悉荟' } }
    );
    logger.info('更新 KnowledgeArticle xihui -> 悉荟 完成');

    // 关闭数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');

    process.exit(0);
  } catch (error) {
    logger.error('更新失败:', error);
    process.exit(1);
  }
}

updateKnowledgeRobotNames(); 