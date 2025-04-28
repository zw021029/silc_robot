require('dotenv').config('../../.env');

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3005,
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG || true,
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3005'
  },
  
  // 数据库配置
  database: {
    url: process.env.MONGODB_URI || 'mongodb://sirius:132239@127.0.0.1:27017/silc_robot',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'silc_robot',
      authSource: 'silc_robot'
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
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },

  // 缓存配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },

  // OpenAI API 配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },

  // 微信配置
  wechat: {
    appid: process.env.WECHAT_APPID || 'your-appid-here',
    secret: process.env.WECHAT_SECRET || 'your-secret-here'
  }
};