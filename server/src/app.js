const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { connectDB } = require('./utils/database');
const logger = require('./utils/logger');
const apiRoutes = require('./api');
const { setupErrorHandlers } = require('./middlewares/error');

const app = express();

// 连接数据库
connectDB();

// 中间件配置
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(logger.logRequest);  // 请求日志记录

// API 路由
app.use('/api', apiRoutes);

// 在所有路由之后设置错误处理
setupErrorHandlers(app);

// 启动服务器
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，准备关闭服务器');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;