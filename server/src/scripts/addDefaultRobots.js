require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Robot = require('../models/robot');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 检查是否存在机器人
    const robots = await Robot.find({});
    console.log(`找到 ${robots.length} 个机器人`);
    
    if (robots.length === 0) {
      console.log('添加默认机器人');
      
      // 添加悉文机器人
      await Robot.create({
        name: '悉文',
        displayName: '悉文',
        description: '直男风格，适合简单直接的问答',
        avatar: '/assets/images/xiwen_avatar.png',
        type: 'male',
        model: 'gpt-3.5-turbo',
        systemPrompt: '你是悉商商学院的智能助手悉文，性格直率，回答简洁明了。',
        characteristics: {
          gender: 'male',
          personality: 'direct',
          tone: 'casual'
        },
        status: 'active'
      });
      
      // 添加悉荟机器人
      await Robot.create({
        name: '悉荟',
        displayName: '悉荟',
        description: '温柔可爱，适合情感交流',
        avatar: '/assets/images/xihui_avatar.png',
        type: 'female',
        model: 'gpt-3.5-turbo',
        systemPrompt: '你是悉商商学院的智能助手悉荟，性格温柔体贴，回答亲切细致。',
        characteristics: {
          gender: 'female',
          personality: 'caring',
          tone: 'sweet'
        },
        status: 'active'
      });
      
      console.log('默认机器人添加完成');
    } else {
      console.log('已存在机器人:');
      robots.forEach(robot => {
        console.log(`- ${robot.name} (${robot.displayName}): ${robot.description}`);
      });
    }
  } catch (error) {
    console.error('添加机器人失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 