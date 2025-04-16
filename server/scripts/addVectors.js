require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const { KnowledgeArticle } = require('../src/models/knowledge');
const { getEmbedding } = require('../src/utils/embedding');
const logger = require('../src/utils/logger');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc_robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 查找所有没有向量的文章
    const articles = await KnowledgeArticle.find({ 
      $or: [
        { vector: { $exists: false } },
        { vector: null },
        { vector: {} },
        { embeddings: false }
      ]
    });
    
    console.log(`找到 ${articles.length} 篇需要添加向量的文章`);
    
    if (articles.length === 0) {
      console.log('所有文章都已有向量表示');
      mongoose.connection.close();
      console.log('数据库连接已关闭');
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // 为每篇文章生成向量表示
    for (const article of articles) {
      try {
        // 使用标题生成向量
        const vector = await getEmbedding(article.title);
        
        if (!vector) {
          console.log(`为文章生成向量失败: ${article.title}`);
          failureCount++;
          continue;
        }
        
        // 更新文章向量
        article.vector = vector;
        article.embeddings = true;
        await article.save();
        
        console.log(`成功为文章添加向量: ${article.title}`);
        successCount++;
      } catch (error) {
        console.error(`处理文章失败: ${article.title}`, error);
        failureCount++;
      }
    }
    
    console.log('向量添加完成');
    console.log(`成功: ${successCount} 篇`);
    console.log(`失败: ${failureCount} 篇`);
  } catch (error) {
    console.error('添加向量失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 