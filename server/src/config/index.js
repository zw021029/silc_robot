require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG || true
  },

  // 数据库配置
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/silc_qa',
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      debug: process.env.DEBUG || false,  // 启用 mongoose debug 模式
    }
  },

  // 日志配置
  logger: require('./logger'),

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d'
  },

  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },

  // 缓存配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
};