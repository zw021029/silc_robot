const logger = require('../utils/logger');
const { error } = require('../utils/response');

// 自定义错误类
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 错误处理
const notFound = (req, res, next) => {
  const err = new AppError(`未找到路由: ${req.originalUrl}`, 404);
  next(err);
};

// 验证错误处理
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  return new AppError(errors.join(', '), 400);
};

// MongoDB 重复键错误处理
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} 已存在`, 400);
};

// JWT 错误处理
const handleJWTError = () => {
  return new AppError('无效的令牌，请重新登录', 401);
};

// JWT 过期错误处理
const handleJWTExpiredError = () => {
  return new AppError('令牌已过期，请重新登录', 401);
};

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.status = err.status || 500;
  
  // 开发环境：发送详细错误信息
  if (process.env.NODE_ENV === 'development') {
    logger.error('错误详情:', {
      status: err.status,
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    return error(res, {
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    }, err.status);
  }

  // 生产环境：处理不同类型的错误
  let errorResponse = err;

  if (err.name === 'ValidationError') {
    errorResponse = handleValidationError(err);
  }
  if (err.code === 11000) {
    errorResponse = handleDuplicateKeyError(err);
  }
  if (err.name === 'JsonWebTokenError') {
    errorResponse = handleJWTError();
  }
  if (err.name === 'TokenExpiredError') {
    errorResponse = handleJWTExpiredError();
  }

  // 记录生产环境错误
  if (err.status === 500) {
    logger.error('服务器错误:', {
      message: err.message,
      path: req.path,
      method: req.method
    });
  }

  // 发送生产环境错误响应
  return error(res, {
    status: errorResponse.status,
    message: errorResponse.message
  }, errorResponse.status);
};

// 未捕获的异常处理
const handleUncaughtException = (err) => {
  logger.error('未捕获的异常:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // 如果是无法恢复的错误，优雅地关闭应用
  if (process.env.NODE_ENV === 'production') {
    console.log('发生致命错误，正在关闭应用...');
    process.exit(1);
  }
};

// 未处理的 Promise 拒绝处理
const handleUnhandledRejection = (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', {
    reason: reason,
    promise: promise
  });
};

// 设置全局错误处理
const setupErrorHandlers = (app) => {
  // 处理未找到的路由
  app.use(notFound);
  
  // 处理所有错误
  app.use(errorHandler);
  
  // 处理未捕获的异常
  process.on('uncaughtException', handleUncaughtException);
  
  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', handleUnhandledRejection);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  setupErrorHandlers
};
