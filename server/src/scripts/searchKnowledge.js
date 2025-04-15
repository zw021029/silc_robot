const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
const { KnowledgeArticle } = require('../models/knowledge');

// 获取命令行参数
const args = process.argv.slice(2);
const helpText = `
使用方法: node searchKnowledge.js [options]

选项:
  -r, --robot <name>     按机器人名称筛选 (悉文/悉荟)
  -c, --category <name>  按分类筛选
  -t, --tag <tag>        按标签筛选
  -s, --search <text>    搜索标题和内容
  -h, --help             显示帮助信息

示例:
  node searchKnowledge.js --robot 悉文 --category 学籍管理
  node searchKnowledge.js --search 课程
  node searchKnowledge.js --tag 学习
`;

// 解析参数
let options = {
  robot: null,
  category: null,
  tag: null,
  search: null
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '-h' || arg === '--help') {
    console.log(helpText);
    process.exit(0);
  } else if (arg === '-r' || arg === '--robot') {
    options.robot = args[++i];
  } else if (arg === '-c' || arg === '--category') {
    options.category = args[++i];
  } else if (arg === '-t' || arg === '--tag') {
    options.tag = args[++i];
  } else if (arg === '-s' || arg === '--search') {
    options.search = args[++i];
  }
}

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 构建查询条件
    const query = {};
    
    if (options.robot) {
      query.robotName = options.robot;
    }
    
    if (options.category) {
      query.category = { $regex: options.category, $options: 'i' };
    }
    
    if (options.tag) {
      query.tags = { $in: [new RegExp(options.tag, 'i')] };
    }
    
    if (options.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { content: { $regex: options.search, $options: 'i' } }
      ];
    }
    
    // 执行查询
    const articles = await KnowledgeArticle.find(query).lean();
    
    // 显示查询结果
    console.log(`查询条件:`, JSON.stringify(options, null, 2));
    console.log(`找到 ${articles.length} 篇匹配文章\n`);
    
    // 显示文章列表
    articles.forEach((article, index) => {
      console.log(`${index + 1}. [${article.robotName}] ${article.title} (${article.category})`);
      console.log(`   标签: ${article.tags.join(', ')}`);
      console.log(`   内容: ${article.content.substring(0, 100)}${article.content.length > 100 ? '...' : ''}\n`);
    });
  } catch (error) {
    console.error('查询文章失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 