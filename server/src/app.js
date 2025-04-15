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
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/admin');

const app = express();
const server = require('http').createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/api/ws/chat'  // 添加 API 路由前缀
});

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

// 注册API路由
app.use('/api/user', userRoutes);
app.use('/api/robot', robotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/admin', adminRoutes);  // 确保这个路由在最后注册

// 添加临时路由创建管理员
app.get('/create-admin', async (req, res) => {
  try {
    const User = require('./models/user');
    const bcrypt = require('bcryptjs');
    
    // 检查是否已存在superadmin用户
    const existingAdmin = await User.findOne({ username: 'superadmin' });
    if (existingAdmin) {
      // 强制更新密码
      const plainPassword = 'admin888';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // 直接更新，绕过中间件
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { password: hashedPassword } }
      );
      
      const updatedAdmin = await User.findById(existingAdmin._id);
      
      return res.json({ 
        success: true, 
        message: '管理员密码已重置', 
        username: 'superadmin', 
        password: plainPassword,
        _id: updatedAdmin._id,
        passwordHash: updatedAdmin.password
      });
    }
    
    // 创建新管理员
    const plainPassword = 'admin888';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    const newAdmin = new User({
      username: 'superadmin',
      password: hashedPassword, // 直接设置哈希，绕过中间件
      email: 'admin@example.com',
      role: 'admin',
      isAdmin: true,
      status: 'active'
    });
    
    await newAdmin.save({ validateBeforeSave: false });
    
    return res.json({ 
      success: true, 
      message: '管理员创建成功',
      username: 'superadmin',
      password: plainPassword,
      _id: newAdmin._id,
      passwordHash: newAdmin.password
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '创建管理员失败', 
      error: error.message 
    });
  }
});

// 添加临时路由测试bcrypt
app.get('/test-bcrypt', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const plainPassword = 'admin888';
    
    // 生成盐和哈希
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);
    
    // 验证哈希
    const isMatch = await bcrypt.compare(plainPassword, hash);
    
    return res.json({
      success: true,
      plainPassword,
      hash,
      isMatch,
      salt
    });
  } catch (error) {
    console.error('bcrypt测试失败:', error);
    return res.status(500).json({
      success: false,
      message: 'bcrypt测试失败',
      error: error.message
    });
  }
});

// 添加一个临时路由创建普通用户
app.get('/create-test-user', async (req, res) => {
  try {
    const User = require('./models/user');
    const bcrypt = require('bcryptjs');
    
    // 创建新用户
    const plainPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    const newUser = new User({
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      role: 'user',
      status: 'active'
    });
    
    await newUser.save({ validateBeforeSave: false });
    
    // 测试哈希匹配
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    
    return res.json({
      success: true,
      message: '测试用户创建成功',
      username: 'testuser',
      password: plainPassword,
      passwordHash: hashedPassword,
      isMatch
    });
  } catch (error) {
    console.error('创建测试用户失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建测试用户失败',
      error: error.message
    });
  }
});

// 错误处理中间件
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