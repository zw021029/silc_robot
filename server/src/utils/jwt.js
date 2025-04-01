const jwt = require('jsonwebtoken');
const config = require('../config');

// 生成token
const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// 验证token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('token无效或已过期');
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 