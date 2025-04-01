/**
 * 响应工具函数
 * 提供统一的API响应格式
 */

// 成功响应
exports.success = (res, data = null, message = '操作成功') => {
  return res.json({
    success: true,
    message,
    data
  });
};

// 错误响应
exports.error = (res, message = '操作失败', status = 400, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(status).json(response);
};

// 未授权响应
exports.unauthorized = (res, message = '未授权访问') => {
  return exports.error(res, message, 401);
};

// 禁止访问响应
exports.forbidden = (res, message = '没有权限执行此操作') => {
  return exports.error(res, message, 403);
};

// 资源不存在响应
exports.notFound = (res, message = '请求的资源不存在') => {
  return exports.error(res, message, 404);
};

// 服务器错误响应
exports.serverError = (res, message = '服务器内部错误', error = null) => {
  if (error && process.env.NODE_ENV !== 'production') {
    console.error('[SERVER ERROR]', error);
    return exports.error(res, `${message}: ${error.message}`, 500);
  }
  return exports.error(res, message, 500);
};

// 参数验证错误响应
exports.validationError = (res, errors) => {
  return exports.error(res, '请求参数验证失败', 422, errors);
};

// 分页数据响应
exports.paginate = (res, data, total, page, limit, message = '获取成功') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
};