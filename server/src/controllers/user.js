const userService = require('../services/user');
const { success, error } = require('../utils/response');

const userController = {
  async register(req, res) {
    try {
      const result = await userService.register(req.body);
      return success(res, result, '注册成功');
    } catch (err) {
      return error(res, err.message);
    }
  },

  async login(req, res) {
    try {
      const { code } = req.body;
      console.log('收到登录请求，code:', code);
      // TODO: 实现登录逻辑
      res.json({
        success: true,
        message: '登录成功',
        data: { code }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
};

module.exports = userController;