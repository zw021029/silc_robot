/**
 * 创建特定场景测试用户脚本
 * 
 * 此脚本用于创建特定场景下的测试用户，包括：
 * - 已绑定悉文的用户
 * - 已绑定悉荟的用户
 * - 未绑定机器人的用户
 * - 有大量积分的用户
 * - 管理员用户
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/create-specific-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/user');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    createSpecificUsers();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 创建特定场景测试用户
 */
async function createSpecificUsers() {
  try {
    // 特定测试用户数据
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

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 处理每个测试用户
    for (const userData of specificUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ username: userData.username });
      
      if (existingUser) {
        console.log(`用户 ${userData.username} 已存在，是否要更新？ (跳过)`);
        skippedCount++;
        continue;
      }

      try {
        // 创建用户
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const newUser = new User({
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newUser.save();
        console.log(`创建特定用户成功: ${userData.username}, 角色: ${userData.role}, 机器人: ${userData.selectedRobot || '未选择'}`);
        createdCount++;
      } catch (error) {
        console.error(`创建用户 ${userData.username} 失败:`, error);
        errorCount++;
      }
    }

    console.log('\n====== 创建特定测试用户完成 ======');
    console.log(`共处理: ${specificUsers.length} 个用户`);
    console.log(`成功创建: ${createdCount} 个用户`);
    console.log(`已存在跳过: ${skippedCount} 个用户`);
    console.log(`失败: ${errorCount} 个用户`);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('创建特定用户出错:', error);
  } finally {
    // 确保脚本结束
    process.exit(0);
  }
} 