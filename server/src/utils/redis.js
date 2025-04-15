const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

// 内存存储（用于开发环境）
const memoryStore = new Map();

// 创建Redis客户端
let redis;
try {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    retryStrategy: (times) => {
      // 如果Redis连接失败，使用内存存储
      if (times > 3) {
        logger.warn('Redis连接失败，使用内存存储');
        return null;
      }
      return Math.min(times * 50, 2000);
    }
  });

  // Redis连接事件处理
  redis.on('connect', () => {
    logger.info('Redis连接成功');
  });

  redis.on('error', (err) => {
    logger.error('Redis连接错误:', err);
  });
} catch (err) {
  logger.error('Redis初始化失败:', err);
}

// 封装存储方法
const storage = {
  // 设置键值对
  set: async (key, value, ...args) => {
    try {
      if (redis) {
        return await redis.set(key, value, ...args);
      } else {
        // 使用内存存储
        memoryStore.set(key, value);
        return 'OK';
      }
    } catch (err) {
      logger.error('存储设置失败:', err);
      throw err;
    }
  },

  // 获取值
  get: async (key) => {
    try {
      if (redis) {
        return await redis.get(key);
      } else {
        // 使用内存存储
        return memoryStore.get(key);
      }
    } catch (err) {
      logger.error('存储获取失败:', err);
      throw err;
    }
  },

  // 删除键
  del: async (key) => {
    try {
      if (redis) {
        return await redis.del(key);
      } else {
        // 使用内存存储
        return memoryStore.delete(key);
      }
    } catch (err) {
      logger.error('存储删除失败:', err);
      throw err;
    }
  },

  // 检查键是否存在
  exists: async (key) => {
    try {
      if (redis) {
        return await redis.exists(key);
      } else {
        // 使用内存存储
        return memoryStore.has(key);
      }
    } catch (err) {
      logger.error('存储检查键失败:', err);
      throw err;
    }
  }
};

module.exports = storage; 