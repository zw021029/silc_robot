require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { KnowledgeArticle } = require('../models/knowledge');

// 检查命令行参数
if (process.argv.length < 3) {
  console.log('用法: node importKnowledge.js <json文件路径>');
  process.exit(1);
}

const filePath = process.argv[2];

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
  console.log(`错误: 文件 ${filePath} 不存在`);
  process.exit(1);
}

// 读取JSON文件
let articles;
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  articles = JSON.parse(fileContent);
  
  if (!Array.isArray(articles)) {
    console.log('错误: JSON文件必须包含文章数组');
    process.exit(1);
  }
  
  console.log(`读取到 ${articles.length} 篇文章`);
} catch (error) {
  console.error('解析JSON文件失败:', error);
  process.exit(1);
}

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 添加前检查重复问题
    const newArticles = [];
    const skippedArticles = [];
    
    for (const article of articles) {
      // 验证必需字段
      if (!article.title || !article.content || !article.category) {
        console.log(`跳过不完整的文章: ${article.title || '无标题'}`);
        continue;
      }
      
      // 统一设置robotName为"all"
      article.robotName = 'all';
      
      // 查找是否存在相同标题的文章
      const existingArticle = await KnowledgeArticle.findOne({ 
        title: article.title
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
      console.log(`成功添加 ${result.length} 篇知识库文章`);
    } else {
      console.log('没有新的文章需要添加');
    }
    
    // 显示跳过的文章
    if (skippedArticles.length > 0) {
      console.log(`跳过 ${skippedArticles.length} 篇重复文章:`);
      skippedArticles.forEach(title => console.log(`- ${title}`));
    }
  } catch (error) {
    console.error('添加知识库文章失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 