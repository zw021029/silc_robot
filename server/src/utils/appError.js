/**
 * 自定义错误类
 * 用于统一处理API错误响应
 */
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; 