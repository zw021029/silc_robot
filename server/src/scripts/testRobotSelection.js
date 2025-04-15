const mongoose = require('mongoose');
const User = require('../models/user');
const Robot = require('../models/robot');
const config = require('../config');
const { getRobotDetails } = require('../services/chat');

// 连接到MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 测试1: 使用ID查找机器人
    const robots = await Robot.find();
    if (robots.length > 0) {
      const robotId = robots[0]._id;
      console.log(`测试1: 使用ID ${robotId} 查找机器人`);
      const robotById = await getRobotDetails(robotId);
      console.log('结果:', robotById ? '成功' : '失败', robotById || '未找到机器人');
    }
    
    // 测试2: 使用名称查找机器人
    console.log('\n测试2: 使用名称 "悉文" 查找机器人');
    const robotByName = await getRobotDetails('悉文');
    console.log('结果:', robotByName ? '成功' : '失败', robotByName || '未找到机器人');
    
    // 测试3: 模拟用户选择机器人场景
    const users = await User.find().limit(1);
    if (users.length > 0) {
      const user = users[0];
      const robot = robots[0];
      
      console.log(`\n测试3: 为用户 ${user.username} 选择机器人 ${robot.name}`);
      user.selectedRobot = robot._id;
      await user.save();
      console.log('用户更新结果: 成功');
      
      // 验证用户已选择机器人
      const updatedUser = await User.findById(user._id).populate('selectedRobot');
      console.log('选择的机器人:', updatedUser.selectedRobot ? updatedUser.selectedRobot.name : '未选择');
    }
    
    console.log('\n所有测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    mongoose.connection.close();
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err);
  process.exit(1);
}); 