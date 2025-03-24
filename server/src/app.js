const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./utils/database');
const routes = require('./api');
const errorMiddleware = require('./middlewares/error');
const logger = require('./utils/logger');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));

// 路由
app.use('/api', routes);

// 错误处理
app.use(errorMiddleware);

// 数据库连接
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;