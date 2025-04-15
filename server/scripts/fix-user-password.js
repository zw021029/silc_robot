/**
 * 修复用户密码脚本
 * 
 * 此脚本用于直接修改admin用户的密码字段为明文123456
 * 注意：通常不建议这样做，仅用于解决本例特殊问题
 * 
 * 运行方式：
 * 在项目根目录下执行: node server/scripts/fix-user-password.js
 */

const mongoose = require('mongoose');
const config = require('../src/config');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    fixPassword();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 修复密码
 */
async function fixPassword() {
  try {
    // 直接使用MongoDB更新语法
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 查找当前admin用户状态
    const admin = await usersCollection.findOne({ username: 'admin' });
    
    if (!admin) {
      console.error('管理员用户不存在');
      process.exit(1);
    }
    
    console.log('当前admin用户信息:');
    console.log(`- 用户名: ${admin.username}`);
    console.log(`- 密码哈希: ${admin.password}`);
    
    // 更新密码为明文(警告：仅用于测试，实际应用中永远不要存储明文密码)
    const result = await usersCollection.updateOne(
      { username: 'admin' },
      { $set: { password: '123456' } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('成功将admin密码更新为明文123456');
      console.log('警告：这是一个仅用于测试的临时解决方案，应尽快使用正规方式重置密码');
    } else {
      console.log('密码更新失败');
    }
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('修复密码失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
} 