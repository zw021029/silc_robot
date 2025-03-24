// 可以使用 joi 库进行数据验证
const Joi = require('joi');

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
        .required()
        .messages({
          'string.email': '请输入有效的邮箱地址',
          'any.required': '邮箱是必填项'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
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
  }
};

module.exports = validate;
