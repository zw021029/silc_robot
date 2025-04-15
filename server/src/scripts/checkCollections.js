require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

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
    
    console.log('\n=====================================\n');
    
    // 检查知识库文章集合
    console.log('检查知识库文章集合:');
    const knowledgeCollections = collections.filter(c => 
      c.name.includes('knowledge') || c.name.includes('article')
    );
    
    if (knowledgeCollections.length === 0) {
      console.log('未找到知识库相关集合');
    } else {
      for (const collection of knowledgeCollections) {
        const docs = await mongoose.connection.db.collection(collection.name).find({}).toArray();
        console.log(`集合 ${collection.name} 有 ${docs.length} 条记录`);
        if (docs.length > 0) {
          console.log('示例记录:');
          console.log(JSON.stringify(docs[0], null, 2).substring(0, 500) + '...');
          
          // 检查robotName字段
          const robotNames = [...new Set(docs.map(doc => doc.robotName))];
          console.log(`robotName值: ${robotNames.join(', ')}`);
        }
      }
    }
    
    console.log('\n=====================================\n');
    
    // 检查机器人集合
    console.log('检查机器人集合:');
    const robotCollections = collections.filter(c => 
      c.name.includes('robot') || c.name.includes('bot')
    );
    
    if (robotCollections.length === 0) {
      console.log('未找到机器人相关集合');
    } else {
      for (const collection of robotCollections) {
        const docs = await mongoose.connection.db.collection(collection.name).find({}).toArray();
        console.log(`集合 ${collection.name} 有 ${docs.length} 条记录`);
        if (docs.length > 0) {
          console.log('示例记录:');
          console.log(JSON.stringify(docs[0], null, 2));
          
          // 打印所有机器人名称
          console.log('所有机器人:');
          docs.forEach(doc => {
            console.log(`- ${doc.name} (ID: ${doc._id})`);
          });
        }
      }
    }
    
    console.log('\n=====================================\n');
    
    // 检查用户集合
    console.log('检查用户集合:');
    const userCollections = collections.filter(c => 
      c.name.includes('user')
    );
    
    if (userCollections.length === 0) {
      console.log('未找到用户相关集合');
    } else {
      for (const collection of userCollections) {
        const docs = await mongoose.connection.db.collection(collection.name).find({}).toArray();
        console.log(`集合 ${collection.name} 有 ${docs.length} 条记录`);
        if (docs.length > 0) {
          // 注意不要显示敏感信息
          const safeUser = {...docs[0]};
          if (safeUser.password) safeUser.password = '***隐藏***';
          console.log('示例用户:');
          console.log(JSON.stringify(safeUser, null, 2));
          
          // 检查selectedRobot字段
          const selectedRobots = docs.map(doc => doc.selectedRobot).filter(r => r);
          console.log(`已选择机器人的用户: ${selectedRobots.length}/${docs.length}`);
          console.log(`selectedRobot值: ${[...new Set(selectedRobots)].join(', ')}`);
        }
      }
    }
  } catch (error) {
    console.error('检查集合失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
})
.catch(err => {
  console.error('MongoDB 连接失败:', err);
}); 