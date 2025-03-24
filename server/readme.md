# 悉商问答系统后端设计文档

## 1. 技术栈选型

### 1.1 核心框架
- Node.js >= 16.x
- Express.js >= 4.18.x
- MongoDB >= 5.0.x
- Redis >= 6.2.x

### 1.2 AI/NLP相关
- OpenAI API (GPT-3.5/4.0)
- Langchain.js
- Vector Database (Pinecone/Milvus)

### 1.3 中间件
- JWT (认证授权)
- Winston (日志管理)
- Mongoose (数据库ORM)
- Bull (任务队列)
- Socket.IO (实时通信)

## 2. 系统架构

### 2.1 核心模块
```
server/
├── src/
│   ├── api/           # API路由
│   ├── config/        # 配置文件
│   ├── controllers/   # 控制器
│   ├── models/        # 数据模型
│   ├── services/      # 业务逻辑
│   ├── utils/         # 工具函数
│   ├── middlewares/   # 中间件
│   └── app.js         # 应用入口
├── scripts/           # 部署脚本
└── tests/            # 测试文件
```

### 2.2 数据库设计

#### 用户模块 (Users)
```javascript
{
  _id: ObjectId,
  openid: String,          // 微信openid
  nickname: String,        // 用户昵称
  avatar: String,          // 头像URL
  phone: String,          // 手机号
  points: Number,         // 积分
  selectedRobot: String,  // 选择的机器人
  role: String,          // 用户角色(user/admin)
  createdAt: Date,
  updatedAt: Date
}
```

#### 机器人模块 (Robots)
```javascript
{
  _id: ObjectId,
  name: String,           // 机器人名称
  type: String,          // 类型(xiwen/xihui)
  avatar: String,        // 头像URL
  personality: {         // 性格特征
    style: String,      // 对话风格
    tone: String,       // 语气
    characteristics: [String] // 特点标签
  },
  prompts: [String],    // 预设提示语
  createdAt: Date,
  updatedAt: Date
}
```

#### 对话记录 (Conversations)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,      // 用户ID
  robotId: ObjectId,     // 机器人ID
  messages: [{
    role: String,       // 发送者角色
    content: String,    // 内容
    timestamp: Date,    // 时间戳
    references: [{      // 知识库引用
      sourceId: ObjectId,
      content: String,
      similarity: Number
    }]
  }],
  evaluation: {         // 对话评价
    score: Number,     // 评分
    feedback: String,  // 反馈内容
    timestamp: Date    // 评价时间
  },
  status: String,      // 对话状态
  createdAt: Date,
  updatedAt: Date
}
```

#### 知识库 (Knowledge)
```javascript
{
  _id: ObjectId,
  title: String,        // 文档标题
  content: String,      // 原始内容
  chunks: [{           // 分段内容
    content: String,   // 段落内容
    embedding: Array,  // 向量编码
    metadata: Object   // 元数据
  }],
  type: String,        // 文档类型
  status: String,      // 处理状态
  createdAt: Date,
  updatedAt: Date
}
```

#### 积分记录 (PointsLogs)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,     // 用户ID
  type: String,         // 积分类型
  points: Number,       // 积分数量
  description: String,  // 描述
  createdAt: Date
}
```

#### 积分商城 (Rewards)
```javascript
{
  _id: ObjectId,
  name: String,         // 奖品名称
  description: String,  // 描述
  points: Number,       // 所需积分
  stock: Number,        // 库存
  status: String,      // 状态
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 API接口设计

#### 用户相关
- POST /api/user/login - 用户登录
- POST /api/user/register - 用户注册
- GET /api/user/info - 获取用户信息
- PUT /api/user/info - 更新用户信息
- GET /api/user/points - 获取积分信息
- GET /api/user/points/history - 获取积分历史

#### 对话相关
- POST /api/chat/send - 发送消息
- GET /api/chat/history - 获取历史记录
- POST /api/chat/evaluate - 评价对话
- GET /api/chat/context - 获取上下文

#### 机器人相关
- GET /api/robot/list - 获取机器人列表
- POST /api/robot/select - 选择机器人
- GET /api/robot/info - 获取机器人信息

#### 知识库相关
- POST /api/knowledge/upload - 上传知识文档
- GET /api/knowledge/list - 获取知识列表
- POST /api/knowledge/train - 训练知识库
- GET /api/knowledge/status - 获取训练状态

#### 积分商城相关
- GET /api/rewards/list - 获取奖品列表
- POST /api/rewards/exchange - 兑换奖品
- GET /api/rewards/orders - 获取兑换记录

#### 管理员相关
- GET /api/admin/users - 用户管理
- GET /api/admin/conversations - 对话记录管理
- GET /api/admin/knowledge - 知识库管理
- GET /api/admin/statistics - 数据统计

## 3. 核心功能实现

### 3.1 对话系统
1. 使用 Socket.IO 实现实时对话
2. 集成 OpenAI API 处理自然语言
3. 使用 Langchain 处理多轮对话
4. 实现知识库检索和相关度计算

### 3.2 知识库管理
1. 文档解析和分块处理
2. 向量化存储和检索
3. 相似度计算和匹配
4. 训练状态管理

### 3.3 积分系统
1. 积分规则配置
2. 积分变更事务处理
3. 兑换流程管理
4. 库存管理

## 4. 部署说明

### 4.1 环境要求
- Node.js >= 16.x
- MongoDB >= 5.0.x
- Redis >= 6.2.x
- PM2 (进程管理)

### 4.2 配置文件
```javascript
// config/default.js
module.exports = {
  port: 3000,
  mongodb: {
    uri: 'mongodb://localhost:27017/silc_qa'
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '7d'
  },
  openai: {
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo'
  }
}
```

### 4.3 部署步骤
1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置必要的环境变量
```

3. 初始化数据库
```bash
npm run db:init
```

4. 启动服务
```bash
npm run start:prod
```

### 4.4 监控和维护
1. 使用 PM2 进行进程管理
2. 配置 Winston 日志系统
3. 设置监控告警
4. 定期数据备份

## 5. 安全措施

### 5.1 接口安全
1. 实现 JWT 认证
2. 接口频率限制
3. 数据验证和清洗
4. CORS 配置

### 5.2 数据安全
1. 敏感数据加密
2. 数据库备份
3. 日志脱敏
4. 权限控制

## 6. 性能优化

### 6.1 缓存策略
1. Redis 缓存热点数据
2. 数据库索引优化
3. 静态资源缓存

### 6.2 并发处理
1. 任务队列
2. 限流措施
3. 连接池管理

## 7. 测试规范

### 7.1 单元测试
1. 控制器测试
2. 服务层测试
3. 工具函数测试

### 7.2 接口测试
1. API 功能测试
2. 性能测试
3. 安全测试

## 8. 开发规范

### 8.1 代码规范
1. ESLint 配置
2. 代码格式化
3. 命名规范
4. 注释规范

### 8.2 Git规范
1. 分支管理
2. 提交信息规范
3. 版本发布流程

## 9. 文档维护

### 9.1 接口文档
- 使用 Swagger 自动生成API文档
- 定期更新接口文档

### 9.2 部署文档
- 环境搭建文档
- 配置说明文档
- 维护手册

## 10. 更新计划

### 10.1 近期更新
1. 优化对话体验
2. 完善积分系统
3. 增强知识库管理

### 10.2 长期规划
1. 引入更多AI模型
2. 扩展积分应用场景
3. 优化系统性能

## 11. 前后端连接设计

### 11.1 服务器部署架构
```
                                    +-----------------+
                                    |   微信小程序端   |
                                    +-----------------+
                                            ↓
                                    [HTTPS/WebSocket]
                                            ↓
+----------------+              +------------------------+
|   阿里云CDN    | ←→ HTTPS →   |  Nginx反向代理(443端口) |
+----------------+              +------------------------+
                                            ↓
                                    [内部转发(3000端口)]
                                            ↓
                               +-------------------------+
                               |   Node.js应用服务(PM2)   |
                               +-------------------------+
                                            ↓
                        +---------------+---------------+
                        ↓               ↓               ↓
                  +---------+    +-----------+    +---------+
                  | MongoDB |    |   Redis   |    | Milvus  |
                  +---------+    +-----------+    +---------+
```

### 11.2 域名和证书配置
1. 域名配置
```nginx
# nginx配置示例
server {
    listen 443 ssl;
    server_name api.your-domain.com;  # 替换为实际域名

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

2. SSL证书
- 使用Let's Encrypt免费证书
- 配置证书自动更新
- 启用HTTPS强制跳转

### 11.3 前端配置
1. 环境配置文件 (client/config/index.js)
```javascript
const config = {
  development: {
    baseUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000'
  },
  production: {
    baseUrl: 'https://api.your-domain.com',
    wsUrl: 'wss://api.your-domain.com'
  }
}

export default config[process.env.NODE_ENV || 'development']
```

2. 请求封装 (client/utils/request.js)
```javascript
import config from '../config/index'

const request = (url, options = {}) => {
  const token = wx.getStorageSync('token')
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}${url}`,
      ...options,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // token过期处理
          wx.removeStorageSync('token')
          wx.redirectTo({ url: '/pages/login/login' })
          reject(new Error('登录已过期'))
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

export default request
```

3. WebSocket连接 (client/utils/socket.js)
```javascript
import config from '../config/index'
import EventEmitter from './eventEmitter'

class SocketClient extends EventEmitter {
  constructor() {
    super()
    this.socketTask = null
    this.isConnected = false
    this.reconnectTimer = null
    this.reconnectCount = 0
    this.maxReconnectCount = 5
  }

  connect() {
    if (this.socketTask || this.isConnected) return

    const token = wx.getStorageSync('token')
    this.socketTask = wx.connectSocket({
      url: `${config.wsUrl}?token=${token}`,
      success: () => {
        console.log('WebSocket连接成功')
      }
    })

    this.initEventHandlers()
  }

  initEventHandlers() {
    this.socketTask.onOpen(() => {
      this.isConnected = true
      this.reconnectCount = 0
      this.emit('connect')
    })

    this.socketTask.onClose(() => {
      this.isConnected = false
      this.socketTask = null
      this.handleReconnect()
      this.emit('disconnect')
    })

    this.socketTask.onError((error) => {
      console.error('WebSocket错误:', error)
      this.emit('error', error)
    })

    this.socketTask.onMessage((message) => {
      try {
        const data = JSON.parse(message.data)
        this.emit('message', data)
      } catch (error) {
        console.error('消息解析错误:', error)
      }
    })
  }

  handleReconnect() {
    if (this.reconnectCount >= this.maxReconnectCount) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++
      this.connect()
    }, 3000 * Math.min(this.reconnectCount + 1, 3))
  }

  send(data) {
    if (!this.isConnected) {
      throw new Error('WebSocket未连接')
    }

    return new Promise((resolve, reject) => {
      this.socketTask.send({
        data: JSON.stringify(data),
        success: resolve,
        fail: reject
      })
    })
  }

  close() {
    if (this.socketTask) {
      this.socketTask.close()
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.isConnected = false
    this.socketTask = null
    this.reconnectCount = 0
  }
}

export default new SocketClient()
```

### 11.4 服务器配置

1. 防火墙配置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 27017 # MongoDB（建议只允许内网访问）
sudo ufw allow 6379  # Redis（建议只允许内网访问）
```

2. 进程管理配置 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'silc-qa-api',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

3. 日志配置
```javascript
// src/config/winston.js
const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

module.exports = logger
```

### 11.5 监控和告警

1. 性能监控
```javascript
// src/middlewares/monitor.js
const prometheus = require('prom-client')
const register = new prometheus.Registry()

// 添加默认指标
prometheus.collectDefaultMetrics({ register })

// 自定义指标
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
})
register.registerMetric(httpRequestDurationMicroseconds)

module.exports = {
  register,
  httpRequestDurationMicroseconds
}
```

2. 错误告警
```javascript
// src/utils/alert.js
const axios = require('axios')

class AlertService {
  static async sendDingTalkAlert(message) {
    try {
      await axios.post(process.env.DINGTALK_WEBHOOK, {
        msgtype: 'text',
        text: {
          content: `[SILC-QA告警]\n${message}`
        }
      })
    } catch (error) {
      console.error('发送告警失败:', error)
    }
  }
}

module.exports = AlertService
```

### 11.6 部署检查清单

1. 服务器环境
- [ ] Node.js版本检查
- [ ] MongoDB安装和配置
- [ ] Redis安装和配置
- [ ] Nginx安装和配置
- [ ] PM2安装

2. 安全配置
- [ ] 防火墙规则
- [ ] SSL证书
- [ ] 数据库访问限制
- [ ] 日志加密

3. 应用配置
- [ ] 环境变量
- [ ] 数据库连接
- [ ] WebSocket配置
- [ ] 缓存策略

4. 监控配置
- [ ] 性能监控
- [ ] 错误告警
- [ ] 日志收集
- [ ] 备份策略 