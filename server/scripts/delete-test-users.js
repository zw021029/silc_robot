/**
 * 删除测试用户脚本
 * 
 * 此脚本用于删除测试用户，以便在测试完毕后清理数据库。
 * 
 * 运行方式：
 * 在项目根目录下执行: node scripts/delete-test-users.js
 * 
 * 脚本会删除默认测试用户和批量创建的测试用户。
 */

const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/user');

// 连接数据库
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('数据库连接成功');
    deleteTestUsers();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

/**
 * 删除测试用户
 */
async function deleteTestUsers() {
  try {
    console.log('开始删除测试用户...');
    
    // 删除标准测试用户
    const standardTestUsers = [
      'testuser1', 'testuser2', 'testuser3', 'testuser4', 'testuser5',
      'xiwen_user', 'xihui_user', 'new_user', 'rich_user'
    ];
    
    let deletedStandard = 0;
    for (const username of standardTestUsers) {
      try {
        const result = await User.deleteOne({ username });
        if (result.deletedCount > 0) {
          console.log(`删除用户成功: ${username}`);
          deletedStandard++;
        } else {
          console.log(`用户不存在: ${username}`);
        }
      } catch (error) {
        console.error(`删除用户 ${username} 失败:`, error);
      }
    }
    
    // 删除批量创建的测试用户 (以'batch_user_'开头)
    const batchResult = await User.deleteMany({ username: /^batch_user_/ });
    console.log(`删除批量测试用户: ${batchResult.deletedCount} 个`);
    
    console.log('\n====== 删除测试用户完成 ======');
    console.log(`删除标准测试用户: ${deletedStandard} 个`);
    console.log(`删除批量测试用户: ${batchResult.deletedCount} 个`);
    console.log(`总计删除: ${deletedStandard + batchResult.deletedCount} 个用户`);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('删除测试用户出错:', error);
  } finally {
    // 确保脚本结束
    process.exit(0);
  }
} 