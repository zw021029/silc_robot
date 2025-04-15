const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
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
    const articles = await KnowledgeArticle.find({}).lean();
    console.log(`数据库中共有 ${articles.length} 篇文章`);
    
    // 按标题将悉文和悉荟的文章分组
    const articleGroups = {};
    
    articles.forEach(article => {
      const key = article.title;
      if (!articleGroups[key]) {
        articleGroups[key] = [];
      }
      articleGroups[key].push(article);
    });
    
    // 统计需要合并的文章
    const mergeCandidates = Object.values(articleGroups).filter(group => group.length > 1);
    console.log(`发现 ${mergeCandidates.length} 组可合并的文章`);
    
    if (mergeCandidates.length > 0) {
      // 询问用户是否确认合并
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      // 显示可合并的文章示例
      console.log('\n合并候选文章示例:');
      mergeCandidates.slice(0, 3).forEach((group, index) => {
        console.log(`\n组 ${index + 1}:`);
        group.forEach(article => {
          console.log(`- [${article.robotName}] ${article.title}`);
          console.log(`  内容: ${article.content.substring(0, 100)}${article.content.length > 100 ? '...' : ''}`);
        });
      });
      
      readline.question('\n是否将所有文章合并并设置为"all"机器人？(y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // 修改所有文章的robotName为"all"
          let updateCount = 0;
          
          // 先处理没有重复的文章
          const singleArticles = Object.values(articleGroups).filter(group => group.length === 1);
          for (const group of singleArticles) {
            const article = group[0];
            await KnowledgeArticle.updateOne(
              { _id: article._id },
              { $set: { robotName: 'all' } }
            );
            updateCount++;
          }
          
          // 处理需要合并的文章组
          for (const group of mergeCandidates) {
            // 保留第一篇文章，更新robotName为"all"
            await KnowledgeArticle.updateOne(
              { _id: group[0]._id },
              { $set: { robotName: 'all' } }
            );
            updateCount++;
            
            // 删除其余重复文章
            const deleteIds = group.slice(1).map(article => article._id);
            if (deleteIds.length > 0) {
              await KnowledgeArticle.deleteMany({ _id: { $in: deleteIds } });
              console.log(`删除了 ${deleteIds.length} 篇重复文章`);
            }
          }
          
          console.log(`成功更新 ${updateCount} 篇文章为通用知识`);
        } else {
          console.log('操作已取消');
        }
        
        readline.close();
        mongoose.connection.close();
        console.log('数据库连接已关闭');
      });
    } else {
      console.log('没有需要合并的文章，将所有文章设置为通用知识');
      
      // 将所有文章的robotName更新为"all"
      const result = await KnowledgeArticle.updateMany(
        {},
        { $set: { robotName: 'all' } }
      );
      
      console.log(`成功更新 ${result.modifiedCount} 篇文章为通用知识`);
      mongoose.connection.close();
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('合并知识库失败:', error);
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 