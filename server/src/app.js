const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const WebSocket = require('ws');
const config = require('./config');
const { connectDB } = require('./utils/database');
const logger = require('./utils/logger');
const apiRoutes = require('./api');
const { setupErrorHandlers } = require('./middlewares/error');
const { verifyToken } = require('./middlewares/auth');

// 导入路由
const userRoutes = require('./routes/user');
const robotRoutes = require('./routes/robot');
const chatRoutes = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const historyRoutes = require('./routes/history');
const pointsRoutes = require('./routes/points');
const taskRoutes = require('./routes/taskRoutes');  // 添加任务路由

const app = express();
const server = require('http').createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  logger.info('新的WebSocket连接');

  // 从URL中获取token
  const url = new URL(req.url, `http://localhost:${config.server.port}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, '未提供认证token');
    return;
  }

  try {
    // 验证token
    const decoded = verifyToken(token);
    ws.userId = decoded._id;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info('收到WebSocket消息:', data);
        
        // 广播消息给所有连接的客户端
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              data: {
                userId: ws.userId,
                content: data.content
              }
            }));
          }
        });
      } catch (error) {
        logger.error('处理WebSocket消息失败:', error);
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket连接关闭');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket错误:', error);
    });
  } catch (error) {
    logger.error('WebSocket认证失败:', error);
    ws.close(1008, '认证失败');
  }
});

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

// 注册API路由
app.use('/api/user', userRoutes);
app.use('/api/robot', robotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/tasks', taskRoutes);  // 注册任务路由

// 在所有路由之后设置错误处理
setupErrorHandlers(app);

// 启动服务器
const PORT = config.server.port;
server.listen(PORT, () => {
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