/**
 * 修复登录问题脚本
 * 
 * 此脚本用于修复admin用户的密码，使用bcrypt正确加密
 * 
 * 运行方式：
 * 在项目根目录下执行: node server/scripts/fix-login.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    fixLogin();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 修复登录
 */
async function fixLogin() {
  try {
    // 使用MongoDB原生API
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
    console.log(`- 密码字段: ${admin.password}`);
    
    // 生成密码哈希
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log(`新生成的密码哈希: ${hashedPassword}`);
    
    // 更新密码哈希
    const result = await usersCollection.updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`成功更新admin密码哈希为: ${hashedPassword}`);
      
      // 验证新密码是否能正确匹配
      const isMatch = await bcrypt.compare(password, hashedPassword);
      console.log(`验证新密码哈希: ${isMatch ? '成功' : '失败'}`);
    } else {
      console.log('密码更新失败');
    }
    
    // 验证登录逻辑
    const updatedAdmin = await usersCollection.findOne({ username: 'admin' });
    console.log(`更新后的密码哈希: ${updatedAdmin.password}`);
    
    const testPassword = '123456';
    const testMatch = await bcrypt.compare(testPassword, updatedAdmin.password);
    console.log(`测试密码 "${testPassword}" 匹配结果: ${testMatch ? '成功' : '失败'}`);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('修复登录失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
} 