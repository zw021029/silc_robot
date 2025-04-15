/**
 * 修复管理员用户脚本
 * 
 * 此脚本用于修复admin用户的selectedRobot字段和密码
 * 
 * 运行方式：
 * 在项目根目录下执行: node server/scripts/fix-admin-user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/user');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    fixAdminUser();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 修复管理员用户
 */
async function fixAdminUser() {
  try {
    // 查找用户
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      console.error('管理员用户不存在');
      process.exit(1);
    }

    console.log('当前管理员状态:');
    console.log(`- 用户名: ${admin.username}`);
    console.log(`- 昵称: ${admin.nickname}`);
    console.log(`- 角色: ${admin.role}`);
    console.log(`- 管理员权限: ${admin.isAdmin}`);
    console.log(`- 选择的机器人: ${admin.selectedRobot}`);
    console.log(`- 密码哈希: ${admin.password}`);
    
    // 生成新密码的哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // 更新用户信息
    admin.selectedRobot = '悉荟'; // 将"悉慧"改为"悉荟"
    admin.password = hashedPassword; // 更新密码为admin123
    
    await admin.save();

    console.log('\n更新后的管理员状态:');
    console.log(`- 用户名: ${admin.username}`);
    console.log(`- 昵称: ${admin.nickname}`);
    console.log(`- 角色: ${admin.role}`);
    console.log(`- 管理员权限: ${admin.isAdmin}`);
    console.log(`- 选择的机器人: ${admin.selectedRobot}`);
    console.log(`- 新密码哈希: ${admin.password}`);
    
    console.log('\n成功修复管理员用户！');
    console.log('用户名: admin');
    console.log('密码: admin123');

    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('修复管理员用户失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
} 