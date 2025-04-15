require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silc0325', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB 连接成功');
  
  try {
    // 获取所有集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('数据库中的集合:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // 查找用户集合
    const usersCollection = collections.find(c => 
      c.name === 'users' || c.name.includes('user')
    );
    
    if (!usersCollection) {
      console.log('未找到用户集合，无法修复');
      return;
    }
    
    console.log(`找到用户集合: ${usersCollection.name}`);
    
    // 获取机器人集合
    const robotsCollection = collections.find(c => c.name === 'robots');
    if (!robotsCollection) {
      console.log('未找到机器人集合，无法修复');
      return;
    }
    
    console.log(`找到机器人集合: ${robotsCollection.name}`);
    
    // 获取所有机器人
    const robots = await mongoose.connection.db.collection('robots').find({}).toArray();
    console.log(`找到 ${robots.length} 个机器人:`);
    robots.forEach(robot => {
      console.log(`- ${robot.name} (ID: ${robot._id})`);
    });
    
    // 获取所有用户
    const users = await mongoose.connection.db.collection(usersCollection.name).find({}).toArray();
    console.log(`找到 ${users.length} 个用户`);
    
    // 检查并修复用户的selectedRobot字段
    let updateCount = 0;
    for (const user of users) {
      const selectedRobot = user.selectedRobot;
      
      // 如果用户已经选择了机器人，但它是字符串而不是ObjectId
      if (selectedRobot && typeof selectedRobot === 'string') {
        // 查找对应的机器人
        const robot = robots.find(r => r.name === selectedRobot);
        
        if (robot) {
          console.log(`用户 ${user.username || user._id} 的机器人引用需要修复`);
          console.log(`- 当前值: ${selectedRobot} (类型: ${typeof selectedRobot})`);
          console.log(`- 将更新为: ${robot._id} (类型: ObjectId)`);
          
          // 更新用户的机器人引用
          await mongoose.connection.db.collection(usersCollection.name).updateOne(
            { _id: user._id },
            { $set: { selectedRobot: robot._id } }
          );
          
          updateCount++;
        } else {
          console.log(`用户 ${user.username || user._id} 引用了不存在的机器人: ${selectedRobot}`);
          
          // 分配默认机器人（悉文）
          const defaultRobot = robots.find(r => r.name === '悉文');
          if (defaultRobot) {
            console.log(`- 将分配默认机器人: ${defaultRobot.name} (ID: ${defaultRobot._id})`);
            
            await mongoose.connection.db.collection(usersCollection.name).updateOne(
              { _id: user._id },
              { $set: { selectedRobot: defaultRobot._id } }
            );
            
            updateCount++;
          }
        }
      } 
      // 如果用户没有选择机器人
      else if (!selectedRobot) {
        console.log(`用户 ${user.username || user._id} 未选择机器人`);
        
        // 分配默认机器人（悉文）
        const defaultRobot = robots.find(r => r.name === '悉文');
        if (defaultRobot) {
          console.log(`- 将分配默认机器人: ${defaultRobot.name} (ID: ${defaultRobot._id})`);
          
          await mongoose.connection.db.collection(usersCollection.name).updateOne(
            { _id: user._id },
            { $set: { selectedRobot: defaultRobot._id } }
          );
          
          updateCount++;
        }
      }
    }
    
    console.log(`共修复 ${updateCount} 个用户的机器人引用`);
    
    // 检查消息集合中的机器人引用
    const msgCollections = collections.filter(c => 
      c.name === 'messages' || c.name.includes('message')
    );
    
    if (msgCollections.length > 0) {
      console.log(`找到消息集合: ${msgCollections.map(c => c.name).join(', ')}`);
      
      // 处理每个消息集合
      for (const msgCollection of msgCollections) {
        // 查找使用字符串作为robotId的消息
        const messagesWithStringRobotId = await mongoose.connection.db.collection(msgCollection.name)
          .find({ robotId: { $type: 'string' } })
          .toArray();
        
        console.log(`集合 ${msgCollection.name} 中有 ${messagesWithStringRobotId.length} 条消息使用字符串作为robotId`);
        
        if (messagesWithStringRobotId.length > 0) {
          // 获取唯一的robotId字符串值
          const uniqueRobotIds = [...new Set(messagesWithStringRobotId.map(msg => msg.robotId))];
          console.log(`唯一的robotId值: ${uniqueRobotIds.join(', ')}`);
          
          // 创建映射: 字符串名称 -> 机器人ObjectId
          const robotIdMap = {};
          for (const robotName of uniqueRobotIds) {
            const robot = robots.find(r => r.name === robotName);
            if (robot) {
              robotIdMap[robotName] = robot._id;
            }
          }
          
          console.log('机器人ID映射:');
          for (const [name, id] of Object.entries(robotIdMap)) {
            console.log(`- ${name} -> ${id}`);
          }
          
          // 询问是否要更新
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          readline.question('是否要更新消息中的机器人引用？(y/n) ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
              let msgUpdateCount = 0;
              
              for (const [robotName, robotId] of Object.entries(robotIdMap)) {
                const result = await mongoose.connection.db.collection(msgCollection.name).updateMany(
                  { robotId: robotName },
                  { $set: { robotId: robotId } }
                );
                
                console.log(`已将robotId从"${robotName}"更新为ObjectId(${robotId}): ${result.modifiedCount} 条记录`);
                msgUpdateCount += result.modifiedCount;
              }
              
              console.log(`共更新 ${msgUpdateCount} 条消息的机器人引用`);
            } else {
              console.log('已取消更新消息中的机器人引用');
            }
            
            readline.close();
            mongoose.connection.close();
            console.log('数据库连接已关闭');
          });
        } else {
          // 如果没有字符串类型的robotId，直接关闭连接
          mongoose.connection.close();
          console.log('数据库连接已关闭');
        }
      }
    } else {
      console.log('未找到消息集合');
      mongoose.connection.close();
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('修复机器人引用失败:', error);
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 