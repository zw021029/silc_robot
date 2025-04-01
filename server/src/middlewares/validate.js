// 可以使用 joi 库进行数据验证
const Joi = require('joi');
const path = require('path');

const validate = {
  // 注册数据验证
  register: (req, res, next) => {
    const schema = Joi.object({
      username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.min': '用户名至少需要3个字符',
          'string.max': '用户名不能超过30个字符',
          'any.required': '用户名是必填项'
        }),
      password: Joi.string()
        .min(6)
        .required()
        .messages({
          'string.min': '密码至少需要6个字符',
          'any.required': '密码是必填项'
        }),
      email: Joi.string()
        .email()
        .messages({
          'string.email': '请提供有效的电子邮件地址'
        })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  },

  // 登录数据验证
  login: (req, res, next) => {
    const schema = Joi.object({
      username: Joi.string()
        .required()
        .messages({
          'any.required': '用户名是必填项'
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': '密码是必填项'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },

  // 更新用户信息验证
  updateProfile: (req, res, next) => {
    const schema = Joi.object({
      username: Joi.string()
        .min(3)
        .max(30),
      email: Joi.string()
        .email(),
      // 可以添加其他需要验证的字段
    }).min(1); // 至少需要更新一个字段

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },

  // 知识库问答对验证
  validateKnowledge: (req, res, next) => {
    const schema = Joi.object({
      question: Joi.string().required().messages({
        'any.required': '问题是必填项',
        'string.empty': '问题不能为空'
      }),
      answer: Joi.string().required().messages({
        'any.required': '答案是必填项',
        'string.empty': '答案不能为空'
      }),
      tags: Joi.array().items(Joi.string()).default([]),
      category: Joi.string().allow(''),
      userId: Joi.string().allow(''),
      items: Joi.array().items(Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).default([]),
        category: Joi.string().allow('')
      }))
    });

    const { error, value } = schema.validate(req.body, { allowUnknown: true });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    req.body = value;
    next();
  },
  
  // 文件上传验证
  validateFile: (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }
    
    const allowedExtensions = ['.pdf', '.csv', '.xlsx', '.xls', '.txt', '.json'];
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: '不支持的文件格式，请上传PDF、CSV、Excel、TXT或JSON文件'
      });
    }
    
    // 文件大小限制 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: '文件大小不能超过10MB'
      });
    }
    
    next();
  },
  
  // 分页参数验证
  validatePagination: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10)
    });
    
    const { error, value } = schema.validate(req.query, { allowUnknown: true });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    req.query.page = value.page;
    req.query.limit = value.limit;
    next();
  },
  
  // 搜索参数验证
  validateSearch: (req, res, next) => {
    const schema = Joi.object({
      keyword: Joi.string().allow(''),
      category: Joi.string().allow(''),
      tags: Joi.array().items(Joi.string()).single().default([]),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate'))
    });
    
    const { error, value } = schema.validate(req.query, { allowUnknown: true });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    // 合并验证后的值到请求查询参数中
    Object.assign(req.query, value);
    next();
  }
};

module.exports = validate;
