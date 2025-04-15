/**
 * 重置用户密码脚本
 * 
 * 此脚本用于重置指定用户的密码。
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/reset-user-password.js username newPassword
 * 例如: node scripts/reset-user-password.js new_user 123456
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/user');

// 获取命令行参数
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('请提供用户名和新密码');
  console.error('用法: node scripts/reset-user-password.js username newPassword');
  process.exit(1);
}

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    resetPassword(username, newPassword);
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 重置用户密码
 */
async function resetPassword(username, newPassword) {
  try {
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`用户 ${username} 不存在`);
      process.exit(1);
    }

    // 生成新密码的哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 显示旧密码哈希
    console.log(`用户 ${username} 的原密码哈希: ${user.password}`);

    // 更新密码
    user.password = hashedPassword;
    await user.save();

    console.log(`用户 ${username} 的新密码哈希: ${hashedPassword}`);
    console.log(`\n成功重置用户 ${username} 的密码为: ${newPassword}`);

    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('重置密码失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
} 