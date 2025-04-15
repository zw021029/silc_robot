const mongoose = require('mongoose');
const { KnowledgeArticle } = require('../models/knowledge');
const studentQA = require('./studentQA');
const { getEmbedding } = require('../utils/embedding');
const logger = require('../utils/logger');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/silc_robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB连接错误:'));
db.once('open', async () => {
  console.log('成功连接到MongoDB');
  
  try {
    // 为每个QA生成向量
    const processedQA = [];
    
    for (const qa of studentQA) {
      // 为标题生成向量
      console.log(`处理问题: ${qa.title}`);
      const vector = await getEmbedding(qa.title);
      
      // 添加向量到QA对象，并将robotId改为robotName
      processedQA.push({
        title: qa.title,
        content: qa.content,
        robotName: qa.robotId,
        category: qa.category,
        tags: qa.tags,
        status: qa.status,
        vector,
        embeddings: true
      });
    }
    
    // 批量添加问答对
    const results = await KnowledgeArticle.insertMany(processedQA);
    console.log(`成功添加 ${results.length} 条问答对，包含向量嵌入`);
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('处理问答对时出错:', error);
    await mongoose.connection.close();
  }
}); 