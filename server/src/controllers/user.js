const userService = require('../services/user');
const { success, error } = require('../utils/response');

class UserController {
  async register(req, res) {
    try {
      const result = await userService.register(req.body);
      return success(res, result, '注册成功');
    } catch (err) {
      return error(res, err.message);
    }
  }

  async login(req, res) {
    try {
      const result = await userService.login(req.body);
      return success(res, result, '登录成功');
    } catch (err) {
      return error(res, err.message);
    }
  }
}

module.exports = new UserController();