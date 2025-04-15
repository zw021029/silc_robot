/**
 * 批量创建测试用户脚本
 * 
 * 此脚本用于批量创建多个测试用户，以便进行大规模测试或演示。
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/batch-create-users.js [数量]
 * 默认创建10个用户，可以通过参数指定创建的数量
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/user');

// 获取要创建的用户数量
const count = parseInt(process.argv[2], 10) || 10;
if (count <= 0 || count > 100) {
  console.error('用户数量必须在1-100之间');
  process.exit(1);
}

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    batchCreateUsers(count);
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 批量创建测试用户
 */
async function batchCreateUsers(count) {
  try {
    const robots = ['悉文', '悉荟', 'none']; // 'none'表示未选择机器人
    let createdCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    console.log(`开始批量创建 ${count} 个测试用户...`);

    // 批量创建用户
    for (let i = 0; i < count; i++) {
      // 生成随机用户数据
      const username = `batch_user_${Math.floor(Math.random() * 10000000)}`;
      const password = '123456';
      const email = `${username}@example.com`;
      const nickname = `批量用户${i + 1}`;
      const robotChoice = getRandomRobot();
      const points = Math.floor(Math.random() * 200);

      try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        
        if (existingUser) {
          console.log(`用户 ${username} 已存在，跳过创建`);
          continue;
        }

        // 创建用户
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // 创建用户数据对象
        const userData = {
          username,
          password: hashedPassword,
          email,
          nickname,
          role: 'user',
          points,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // 只有当选择了机器人时才设置selectedRobot字段
        if (robotChoice !== '') {
          userData.selectedRobot = robotChoice;
        }
        
        const newUser = new User(userData);
        await newUser.save();
        
        console.log(`创建用户成功: ${username}, 选择机器人: ${robotChoice === '' ? '未选择' : robotChoice}, 积分: ${points}`);
        createdCount++;
      } catch (error) {
        console.error(`创建用户失败 ${i+1}:`, error);
        errorCount++;
      }
    }

    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;

    console.log('\n====== 批量创建用户完成 ======');
    console.log(`总数量: ${count}`);
    console.log(`成功创建: ${createdCount} 个用户`);
    console.log(`失败: ${errorCount} 个用户`);
    console.log(`用时: ${elapsedTime.toFixed(2)}秒`);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('批量创建用户出错:', error);
  } finally {
    // 确保脚本结束
    process.exit(0);
  }
}

// 随机选择机器人
const getRandomRobot = () => {
  const robots = ['悉文', '悉荟', 'none']; // 'none'表示未选择机器人
  const index = Math.floor(Math.random() * robots.length);
  return robots[index] === 'none' ? '' : robots[index];
}; 