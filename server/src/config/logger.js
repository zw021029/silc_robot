const path = require('path');

module.exports = {
  // 日志文件配置
  file: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    dirname: path.join(__dirname, '../logs'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    handleExceptions: true,
  },

  // 控制台输出配置
  console: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    handleExceptions: true,
    format: {
      timestamp: true,
      colorize: true,
    }
  },

  // 日志格式配置
  format: {
    timestamp: 'YYYY-MM-DD HH:mm:ss',
    label: 'SILC-QA'
  },

  // 请求日志配置
  request: {
    headerBlacklist: ['authorization', 'cookie'],
    bodyBlacklist: ['password', 'token']
  },

  // 错误日志配置
  error: {
    filename: 'error.log',
    level: 'error',
    handleExceptions: true
  },

  // 访问日志配置
  access: {
    filename: 'access.log',
    frequency: 'daily'
  }
};