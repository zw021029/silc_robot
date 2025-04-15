require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const { KnowledgeArticle } = require('../models/knowledge');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 查找所有文章
    const allArticles = await KnowledgeArticle.find({}).lean();
    console.log(`数据库中共有 ${allArticles.length} 篇文章`);
    
    // 用于跟踪唯一标题
    const uniqueTitles = new Map();
    const duplicates = [];
    
    // 查找重复
    allArticles.forEach(article => {
      const key = `${article.title}_${article.robotName}`;
      
      if (!uniqueTitles.has(key)) {
        uniqueTitles.set(key, article._id);
      } else {
        duplicates.push({
          _id: article._id,
          title: article.title,
          robotName: article.robotName
        });
      }
    });
    
    console.log(`发现 ${duplicates.length} 篇重复文章`);
    
    if (duplicates.length > 0) {
      // 列出部分重复文章
      console.log('重复文章示例:');
      duplicates.slice(0, 5).forEach(doc => {
        console.log(`- ${doc.title} (${doc.robotName})`);
      });
      
      // 询问是否删除
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('是否删除这些重复文章？(y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // 删除重复文章
          const deleteIds = duplicates.map(doc => doc._id);
          const result = await KnowledgeArticle.deleteMany({ _id: { $in: deleteIds } });
          console.log(`已删除 ${result.deletedCount} 篇重复文章`);
        } else {
          console.log('操作已取消');
        }
        
        readline.close();
        mongoose.connection.close();
        console.log('数据库连接已关闭');
      });
    } else {
      console.log('没有发现重复文章');
      mongoose.connection.close();
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('清理重复文章失败:', error);
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 