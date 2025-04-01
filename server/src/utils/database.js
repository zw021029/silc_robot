const mongoose = require('mongoose');
const logger = require('./logger');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'silc_robot'
};

async function connectDB() {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017', options);
    logger.info('MongoDB 连接成功:', conn.connection.host);
  } catch (error) {
    logger.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 连接断开');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB 重新连接成功');
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB 连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭 MongoDB 连接时出错:', error);
    process.exit(1);
  }
});

module.exports = { connectDB };
