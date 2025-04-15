// 导入所有API模块
const user = require('./user');
const robot = require('./robot');
const chat = require('./chat');
const history = require('./history');
const points = require('./points');
const task = require('./task');
const ai = require('./ai');
const stats = require('./stats');
const admin = require('./admin');

// 导出统一的API对象
module.exports = {
  user,
  robot,
  chat,
  history,
  points,
  task,
  ai,
  stats,
  admin
}; 