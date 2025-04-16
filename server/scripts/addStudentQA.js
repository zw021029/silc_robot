require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const { KnowledgeArticle } = require('../src/models/knowledge');
const studentQA = require('./studentQA');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc_robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 添加前检查重复问题
    const newArticles = [];
    const skippedArticles = [];
    
    for (const article of studentQA) {
      // 查找是否存在相同标题的文章
      const existingArticle = await KnowledgeArticle.findOne({ 
        title: article.title,
        robotName: article.robotName 
      });
      
      if (!existingArticle) {
        newArticles.push(article);
      } else {
        skippedArticles.push(article.title);
      }
    }
    
    // 如果有新文章需要添加
    if (newArticles.length > 0) {
      const result = await KnowledgeArticle.insertMany(newArticles);
      console.log(`成功添加 ${result.length} 条学生问答数据`);
    } else {
      console.log('没有新的问答数据需要添加');
    }
    
    // 显示跳过的文章
    if (skippedArticles.length > 0) {
      console.log(`跳过 ${skippedArticles.length} 条重复文章:`);
      skippedArticles.forEach(title => console.log(`- ${title}`));
    }
  } catch (error) {
    console.error('添加问答数据失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 