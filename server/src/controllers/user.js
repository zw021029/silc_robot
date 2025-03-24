const userService = require('../services/user');

const userController = {
  login: async (req, res) => {
    try {
      const { username, password, code } = req.body;
      console.log('登录请求参数:', { username, password, code }); // 添加日志
      
      // 调用 service 层的登录方法，只传入需要的参数
      const result = await userService.login({ username, password, code });
      
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token: result.token,
          userInfo: result.userInfo,  // 注意这里改成 userInfo
          selectedRobot: result.selectedRobot
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(400).json({
        success: false,
        message: error.message || '登录失败'
      });
    }
  },

  register: async (req, res) => {
    try {
      const result = await userService.register(req.body);
      res.json({
        success: true,
        message: '注册成功',
        data: {
          token: result.token,
          userInfo: result.user
        }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(400).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  }
};

module.exports = userController;