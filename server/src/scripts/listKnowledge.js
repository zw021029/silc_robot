const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
const { KnowledgeArticle } = require('../models/knowledge');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    const articles = await KnowledgeArticle.find({}).lean();
    console.log(`数据库中共有 ${articles.length} 篇文章`);
    
    // 按机器人名称分组显示文章数量
    const robotCounts = {};
    articles.forEach(article => {
      const robot = article.robotName;
      robotCounts[robot] = (robotCounts[robot] || 0) + 1;
    });
    
    console.log('按机器人分类统计:');
    Object.keys(robotCounts).forEach(robot => {
      console.log(`- ${robot}: ${robotCounts[robot]} 篇`);
    });
    
    // 按分类显示
    const categories = {};
    articles.forEach(article => {
      const category = article.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    console.log('\n按分类统计:');
    Object.keys(categories).sort().forEach(category => {
      console.log(`- ${category}: ${categories[category]} 篇`);
    });
    
    // 列出所有文章标题
    console.log('\n文章列表:');
    articles.forEach((article, index) => {
      console.log(`${index + 1}. [${article.robotName}] ${article.title}`);
    });
  } catch (error) {
    console.error('查询文章失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 