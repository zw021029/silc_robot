// import_db.js
const config = require('../src/config');

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'silc_robot';
const IMPORT_PATH = path.join(__dirname, 'silc_robot_export.json');
const MONGO_URI = config.database.url;

async function importDatabase() {
  const rawData = fs.readFileSync(IMPORT_PATH);
  const jsonData = JSON.parse(rawData);

  await mongoose.connect(MONGO_URI);

  for (const collectionName in jsonData) {
    const collection = mongoose.connection.db.collection(collectionName);
    await collection.deleteMany({}); // 清空旧数据
    
    // 处理数据，将$oid格式转换回ObjectId
    const processedData = jsonData[collectionName].map(doc => {
      if (doc._id && doc._id.$oid) {
        doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
      }
      return doc;
    });

    if (processedData.length > 0) {
      await collection.insertMany(processedData);
    }
    console.log(`📥 导入集合 ${collectionName}`);
  }

  console.log(`✅ 数据库 ${DB_NAME} 导入完成`);
  await mongoose.disconnect();
}

importDatabase().catch(err => {
  console.error('❌ 导入失败:', err);
  process.exit(1);
});
