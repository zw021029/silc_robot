const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

// 启用 mongoose debug 模式
mongoose.set('debug', config.database.options.debug);

// 更新后的数据库连接选项，移除废弃选项
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.url, options);
    logger.info(`MongoDB 连接成功: ${conn.connection.host}`);

    // 添加更多连接事件监听
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 连接断开');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB 重新连接成功');
    });

  } catch (error) {
    logger.error('MongoDB 连接失败:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    process.exit(1);
  }
};

// 关闭数据库连接
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB 连接已关闭');
  } catch (error) {
    logger.error('关闭 MongoDB 连接时出错:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  closeDB
};
