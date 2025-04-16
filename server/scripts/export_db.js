// export_db.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'silc_robot';
const EXPORT_PATH = path.join(__dirname, 'silc_robot_export.json');
const MONGO_URI = `mongodb://localhost:27017/${DB_NAME}`;

async function exportDatabase() {
  await mongoose.connect(MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  const exportData = {};

  for (const { name } of collections) {
    const data = await mongoose.connection.db.collection(name).find().toArray();
    exportData[name] = data;
  }

  fs.writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2));
  console.log(`✅ 数据库 ${DB_NAME} 导出成功到 ${EXPORT_PATH}`);
  await mongoose.disconnect();
}

exportDatabase().catch(err => {
  console.error('❌ 导出失败:', err);
  process.exit(1);
});
