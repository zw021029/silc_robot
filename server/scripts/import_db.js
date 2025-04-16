// import_db.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'silc_robot';
const IMPORT_PATH = path.join(__dirname, 'silc_robot_export.json');
const MONGO_URI = `mongodb://localhost:27017/${DB_NAME}`;

async function importDatabase() {
  const rawData = fs.readFileSync(IMPORT_PATH);
  const jsonData = JSON.parse(rawData);

  await mongoose.connect(MONGO_URI);

  for (const collectionName in jsonData) {
    const collection = mongoose.connection.db.collection(collectionName);
    await collection.deleteMany({}); // 清空旧数据
    if (jsonData[collectionName].length > 0) {
      await collection.insertMany(jsonData[collectionName]);
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
