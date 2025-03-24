const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, '认证失败', 401);
  }
};