const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('../config');
const path = require('path');
const { Pool } = require('pg');

// 创建 PostgreSQL 连接池
const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD, 
  port: process.env.PG_PORT,
});

// 打印环境变量和配置信息
console.log('当前工作目录:', process.cwd());
console.log('.env 文件路径:', path.resolve('../../.env'));
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('数据库配置:', config.database);

// 设置 mongoose 选项
mongoose.set('strictQuery', false);
mongoose.set('debug', config.server.debug);

async function connectDB() {
  try {
    // 连接 MongoDB
    console.log('开始连接数据库...');
    console.log('连接URL:', config.database.url);
    console.log('连接选项:', config.database.options);
    
    const conn = await mongoose.connect(config.database.url, config.database.options);
    
    console.log('MongoDB 连接成功:');
    console.log('- 主机:', conn.connection.host);
    console.log('- 端口:', conn.connection.port);
    console.log('- 数据库:', conn.connection.name);
    console.log('- 连接状态:', conn.connection.readyState);

    // 测试 PostgreSQL 连接
    const pgClient = await pgPool.connect();
    console.log('PostgreSQL 连接成功');
    pgClient.release();
    
    logger.info('数据库连接成功:', {
      mongodb: {
        host: conn.connection.host,
        port: conn.connection.port,
        database: conn.connection.name,
        readyState: conn.connection.readyState
      },
      postgresql: 'connected'
    });
  } catch (error) {
    console.error('数据库连接失败:');
    console.error('- 错误信息:', error.message);
    console.error('- 错误堆栈:', error.stack);
    
    logger.error('数据库连接失败:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err);
  logger.error('MongoDB 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB 连接断开');
  logger.warn('MongoDB 连接断开');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB 重新连接成功');
  logger.info('MongoDB 重新连接成功');
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB 连接已关闭');
    logger.info('MongoDB 连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('关闭 MongoDB 连接时出错:', error);
    logger.error('关闭 MongoDB 连接时出错:', error);
    process.exit(1);
  }
});

// 导出 PostgreSQL 连接池
module.exports = { 
  connectDB,
  pgPool
};
