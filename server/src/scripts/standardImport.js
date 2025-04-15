require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { KnowledgeArticle } = require('../models/knowledge');

// 检查命令行参数
if (process.argv.length < 3) {
  console.log('用法: node standardImport.js <json文件路径> [分类]');
  console.log('JSON格式可以是标准问答格式（Q/A）或知识库文章格式');
  process.exit(1);
}

const filePath = process.argv[2];
const defaultCategory = process.argv[3] || '其他';

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
  console.log(`错误: 文件 ${filePath} 不存在`);
  process.exit(1);
}

// 读取JSON文件
let qaData;
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  qaData = JSON.parse(fileContent);
  
  if (!Array.isArray(qaData)) {
    console.log('错误: JSON文件必须包含数组');
    process.exit(1);
  }
  
  console.log(`读取到 ${qaData.length} 条数据`);
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
    // 将QA数据转换为标准知识库格式
    const standardizedArticles = [];
    
    for (const item of qaData) {
      let article = {};
      
      // 判断数据格式并标准化
      if (item.question && item.answer) {
        // 标准QA格式
        article = {
          title: item.question,
          content: item.answer,
          robotName: 'all',
          category: item.category || defaultCategory,
          tags: item.tags || item.keywords || [],
          status: 'active'
        };
      } else if (item.title && item.content) {
        // 标准文章格式
        article = {
          title: item.title,
          content: item.content,
          robotName: 'all',
          category: item.category || defaultCategory,
          tags: item.tags || [],
          status: item.status || 'active'
        };
      } else {
        console.log(`跳过无效数据: ${JSON.stringify(item).substring(0, 100)}...`);
        continue;
      }
      
      standardizedArticles.push(article);
    }
    
    console.log(`标准化后共有 ${standardizedArticles.length} 篇文章`);
    
    // 添加前检查重复问题
    const newArticles = [];
    const skippedArticles = [];
    
    for (const article of standardizedArticles) {
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