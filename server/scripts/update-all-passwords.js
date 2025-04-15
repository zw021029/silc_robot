/**
 * 重置所有用户密码为统一哈希值脚本
 * 
 * 此脚本用于将所有测试用户的密码重置为已知可以正确验证的哈希值。
 * 由于bcrypt的哈希每次生成都不同，所以直接使用已知可用的哈希值更安全。
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/update-all-passwords.js
 */

const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/user');

// 这是已验证可以匹配"123456"的密码哈希
const KNOWN_WORKING_HASH = '$2a$10$nEB971g9PivMdpw1XUwnGuq8jUumuaSFP8N/oeGFIcpdSkuLcFgue';

// 需要排除的用户名（管理员账号）
const EXCLUDE_USERNAMES = ['admin', 'superadmin'];

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    updateAllPasswords();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 更新所有用户密码为已知哈希值
 */
async function updateAllPasswords() {
  try {
    console.log('开始更新用户密码...');
    
    // 查询所有非排除用户
    const users = await User.find({ username: { $nin: EXCLUDE_USERNAMES } });
    console.log(`找到 ${users.length} 个用户需要更新密码`);
    
    let updatedCount = 0;
    
    // 更新每个用户的密码
    for (const user of users) {
      // 显示原密码哈希
      console.log(`用户 ${user.username} 的原密码哈希: ${user.password}`);
      
      // 更新为已知可用的哈希值
      await User.updateOne(
        { _id: user._id }, 
        { $set: { password: KNOWN_WORKING_HASH } }
      );
      
      updatedCount++;
      console.log(`已更新用户 ${user.username} 的密码为统一哈希`);
    }
    
    console.log('\n====== 更新密码完成 ======');
    console.log(`总共处理: ${users.length} 个用户`);
    console.log(`成功更新: ${updatedCount} 个用户`);
    
    // 提示信息
    console.log('\n所有用户的密码现在都是: 123456');
    console.log('(注意: admin 和 superadmin 的密码未被修改)');
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('更新密码失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
} 