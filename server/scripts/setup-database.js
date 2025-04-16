require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { KnowledgeArticle } = require('../src/models/knowledge');
const Robot = require('../src/models/robot');
const User = require('../src/models/user');
const { getEmbedding } = require('../src/utils/embedding');
const studentQA = require('./studentQA');

// 数据库配置
const DB_USER = process.env.MONGODB_USER || '';
const DB_PWD = process.env.MONGODB_PASSWORD || '';
const DB_URI = `mongodb://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PWD)}@localhost:27017/silc_robot`;

// 命令行参数处理
const args = process.argv.slice(2);
const shouldRun = (flag) => args.includes(flag);

// 统一数据库连接
async function connectDB() {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
}

// 1. 添加默认机器人
async function addDefaultRobots() {
  try {
    const robots = await Robot.find({});
    console.log(`找到 ${robots.length} 个机器人`);

    if (robots.length === 0) {
      console.log('添加默认机器人...');
      await Robot.insertMany([
        {
          name: '悉文',
          displayName: '悉文',
          description: '直男风格，适合简单直接的问答',
          avatar: '/assets/images/xiwen_avatar.png',
          type: 'male',
          model: 'gpt-3.5-turbo',
          systemPrompt: '你是悉商商学院的智能助手悉文，性格直率，回答简洁明了。',
          characteristics: { gender: 'male', personality: 'direct', tone: 'casual' },
          status: 'active'
        },
        {
          name: '悉荟',
          displayName: '悉荟',
          description: '温柔可爱，适合情感交流',
          avatar: '/assets/images/xihui_avatar.png',
          type: 'female',
          model: 'gpt-3.5-turbo',
          systemPrompt: '你是悉商商学院的智能助手悉荟，性格温柔体贴，回答亲切细致。',
          characteristics: { gender: 'female', personality: 'caring', tone: 'sweet' },
          status: 'active'
        }
      ]);
      console.log('默认机器人添加完成');
    } else {
      console.log('已存在机器人:');
      robots.forEach(r => console.log(`- ${r.name} (${r.displayName})`));
    }
  } catch (error) {
    console.error('处理机器人失败:', error);
    throw error;
  }
}

// 2. 添加学生问答数据
async function addStudentQA() {
  try {
    const newArticles = [];
    const skipped = [];

    for (const article of studentQA) {
      const exists = await KnowledgeArticle.findOne({ 
        title: article.title,
        robotName: article.robotName 
      });
      
      exists ? skipped.push(article.title) : newArticles.push(article);
    }

    if (newArticles.length > 0) {
      await KnowledgeArticle.insertMany(newArticles);
      console.log(`添加 ${newArticles.length} 条新问答数据`);
    } else {
      console.log('没有新的问答数据需要添加');
    }

    if (skipped.length > 0) {
      console.log(`跳过 ${skipped.length} 条重复数据`);
    }
  } catch (error) {
    console.error('处理问答数据失败:', error);
    throw error;
  }
}

// 3. 生成向量数据
async function addVectors() {
  try {
    const articles = await KnowledgeArticle.find({
      $or: [
        { vector: { $exists: false } },
        { vector: null },
        { embeddings: false }
      ]
    });

    console.log(`找到 ${articles.length} 篇需要处理向量`);

    let success = 0, failure = 0;
    for (const article of articles) {
      try {
        const vector = await getEmbedding(article.title);
        if (!vector) throw new Error('生成向量失败');
        
        article.vector = vector;
        article.embeddings = true;
        await article.save();
        success++;
      } catch (error) {
        console.error(`处理失败: ${article.title}`, error.message);
        failure++;
      }
    }

    console.log(`向量处理完成: 成功 ${success} 篇, 失败 ${failure} 篇`);
  } catch (error) {
    console.error('处理向量失败:', error);
    throw error;
  }
}

// 4. 创建测试用户
async function createUsers(users) {
  try {
    let created = 0, skipped = 0;

    for (const userData of users) {
      const exists = await User.findOne({ username: userData.username });
      if (exists) {
        skipped++;
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPwd = await bcrypt.hash(userData.password, salt);
      
      await new User({
        ...userData,
        password: hashedPwd,
        createdAt: new Date(),
        updatedAt: new Date()
      }).save();
      
      created++;
    }

    console.log(`用户创建完成: 新增 ${created} 个, 跳过 ${skipped} 个`);
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 主执行流程
async function main() {
  await connectDB();

  try {
    // 基础数据初始化
    if (shouldRun('--all') || shouldRun('--robots')) {
      await addDefaultRobots();
    }

    if (shouldRun('--all') || shouldRun('--qa')) {
      await addStudentQA();
    }

    if (shouldRun('--all') || shouldRun('--vectors')) {
      await addVectors();
    }

    // 用户创建
    if (shouldRun('--users')) {
        const testUsers = [
            {
              username: 'testuser1',
              password: '123456',
              email: 'test1@example.com',
              nickname: '测试用户1',
              role: 'user',
              selectedRobot: '悉文',
              status: 'active'
            },
            {
              username: 'testuser2',
              password: '123456',
              email: 'testuser2@example.com',
              phone: '13800000002',
              nickname: '测试用户2',
              role: 'user',
              points: 0,
              selectedRobot: '悉荟',
              status: 'active'
            },
            {
              username: 'testuser3',
              password: '123456',
              email: 'test3@example.com',
              nickname: '测试用户3',
              role: 'user',
              // 未选择机器人，不设置selectedRobot字段
              status: 'active'
            },
            {
              username: 'testuser4',
              password: '123456',
              email: 'test4@example.com',
              nickname: '测试用户4',
              role: 'user',
              selectedRobot: '悉文',
              status: 'active',
              points: 100
            },
            {
              username: 'testuser5',
              password: '123456',
              email: 'testuser5@example.com',
              phone: '13800000005',
              nickname: '测试用户5',
              role: 'user',
              points: 50,
              selectedRobot: '悉荟',
              status: 'active'
            },
            {
              username: 'admin',
              password: 'admin123',
              email: 'admin@example.com',
              nickname: '管理员',
              role: 'admin',
              isAdmin: true,
              selectedRobot: '悉文',
              status: 'active'
            }
          ];
        const specificUsers = [
        {
          username: 'xiwen_user',
          password: '123456',
          email: 'xiwen@example.com',
          nickname: '悉文用户',
          role: 'user',
          selectedRobot: '悉文',
          points: 20,
          status: 'active'
        },
        {
          username: 'xihui_user',
          password: '123456',
          email: 'xihui@example.com',
          phone: '13900000002',
          nickname: '悉荟用户',
          role: 'user',
          selectedRobot: '悉荟',
          points: 30,
          status: 'active'
        },
        {
          username: 'new_user',
          password: '123456',
          email: 'new@example.com',
          nickname: '新用户',
          role: 'user',
          // 未选择机器人，不设置selectedRobot字段
          // 注意：在Schema中selectedRobot是enum类型，null不是有效值，必须完全省略此字段
          points: 0,
          status: 'active'
        },
        {
          username: 'rich_user',
          password: '123456',
          email: 'rich@example.com',
          nickname: '土豪用户',
          role: 'user',
          selectedRobot: '悉文',
          points: 9999,
          status: 'active'
        },
        {
          username: 'superadmin',
          password: 'super123',
          email: 'super@example.com',
          nickname: '超级管理员',
          role: 'admin',
          isAdmin: true,
          selectedRobot: '悉文',
          points: 1000,
          status: 'active'
        }
      ];
      await createUsers([...testUsers, ...specificUsers]);
    }
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 启动执行
main().catch(err => {
  console.error('主流程执行出错:', err);
  process.exit(1);
});