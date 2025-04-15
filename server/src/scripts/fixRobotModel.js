require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 修复getRobotReply函数中的查询条件
async function fixChatService() {
  const chatServicePath = path.join(__dirname, '../services/chat.js');
  
  if (!fs.existsSync(chatServicePath)) {
    console.log(`文件不存在: ${chatServicePath}`);
    return false;
  }
  
  console.log(`正在修复文件: ${chatServicePath}`);
  
  // 读取文件内容
  let content = fs.readFileSync(chatServicePath, 'utf8');
  
  // 修改查询条件，将 robotName: 'all' 改为 $or: [{ robotName: 'all' }, { robotName: user.selectedRobot }]
  const originalCode = `const knowledgeList = await KnowledgeArticle.find({ robotName: 'all' });`;
  const newCode = `const knowledgeList = await KnowledgeArticle.find({ 
      $or: [
        { robotName: 'all' }, 
        { robotName: user.selectedRobot }
      ] 
    });`;
  
  if (content.includes(originalCode)) {
    content = content.replace(originalCode, newCode);
    console.log('已修改查询条件');
  } else {
    console.log('未找到需要修改的查询条件');
  }
  
  // 修复 getRobotDetails 函数
  const robotDetailsFix = `
// 获取机器人详情
exports.getRobotDetails = async (robotId) => {
  try {
    // 先按ID查询
    if (mongoose.Types.ObjectId.isValid(robotId)) {
      const robot = await Robot.findById(robotId);
      if (robot) return robot;
    }
    
    // 如果ID查询失败，按名称查询
    const robot = await Robot.findOne({ name: robotId });
    if (robot) return robot;
    
    logger.warn('获取机器人详情失败: 机器人不存在', { robotId });
    throw new Error('机器人不存在');
  } catch (error) {
    logger.error('获取机器人详情失败:', error);
    throw error;
  }
};`;
  
  // 检查是否需要添加这个函数
  if (!content.includes('exports.getRobotDetails = async')) {
    // 添加到文件末尾
    content += '\n' + robotDetailsFix;
    console.log('已添加 getRobotDetails 函数');
  } else {
    console.log('getRobotDetails 函数已存在');
  }
  
  // 写入修改后的内容
  fs.writeFileSync(chatServicePath, content, 'utf8');
  console.log('文件已更新');
  
  return true;
}

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 修复服务文件
    const serviceFixed = await fixChatService();
    
    if (serviceFixed) {
      console.log('服务文件修复完成，请重启服务器使更改生效');
    } else {
      console.log('服务文件修复失败');
    }
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 