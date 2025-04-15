/**
 * 创建测试用户脚本
 * 
 * 此脚本用于创建多个测试用户，以便进行系统功能测试。
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/create-test-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/user');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    createTestUsers();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 创建测试用户
 */
async function createTestUsers() {
  try {
    // 测试用户数据
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

    let createdCount = 0;
    let errorCount = 0;

    // 处理每个测试用户
    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ username: userData.username });
      
      if (existingUser) {
        console.log(`用户 ${userData.username} 已存在，跳过创建`);
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
        console.log(`创建用户成功: ${userData.username}`);
        createdCount++;
      } catch (error) {
        console.error(`创建用户 ${userData.username} 失败:`, error);
        errorCount++;
      }
    }

    console.log('\n====== 创建测试用户完成 ======');
    console.log(`共处理: ${testUsers.length} 个用户`);
    console.log(`成功创建: ${createdCount} 个用户`);
    console.log(`失败: ${errorCount} 个用户`);
    console.log(`已存在: ${testUsers.length - createdCount - errorCount} 个用户`);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('创建测试用户出错:', error);
  } finally {
    // 确保脚本结束
    process.exit(0);
  }
} 