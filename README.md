# SILC-QA 智能问答系统

一个基于微信小程序的智能问答系统，包含用户管理、聊天功能等模块。

## 项目目录结构说明

```
silc-qa/                      # 项目根目录
├── client/                   # 微信小程序前端
│   ├── api/                 # API 接口封装
│   ├── components/          # 公共组件
│   ├── pages/              # 页面文件
│   ├── utils/              # 工具函数
│   └── app.js              # 小程序入口文件
│
├── scripts/                  # 脚本文件目录
│   ├── deploy.sh           # 部署脚本
│   └── init-db.js          # 数据库初始化脚本
│
└── server/                   # 后端服务
    ├── logs/                # 日志文件目录
    │   ├── access.log      # 访问日志
    │   ├── error.log       # 错误日志
    │   └── combined.log    # 综合日志
    │
    └── src/                 # 源代码目录
        ├── api/             # API 相关文件
        │   └── routes/     # 路由定义
        │       ├── user.js # 用户相关路由
        │       └── chat.js # 聊天相关路由
        │
        ├── config/          # 配置文件目录
        │   ├── index.js    # 主配置文件
        │   └── db.js       # 数据库配置
        │
        ├── controllers/     # 控制器层
        │   ├── user.js     # 用户控制器
        │   └── chat.js     # 聊天控制器
        │
        ├── middlewares/     # 中间件
        │   ├── auth.js     # 认证中间件
        │   └── validate.js # 数据验证中间件
        │
        ├── models/          # 数据模型
        │   ├── user.js     # 用户模型
        │   └── chat.js     # 聊天模型
        │
        ├── services/        # 业务逻辑层
        │   ├── user.js     # 用户服务
        │   └── chat.js     # 聊天服务
        │
        └── utils/           # 工具函数
            ├── logger.js    # 日志工具
            └── helper.js    # 辅助函数
```

### 目录说明

1. `client/`: 微信小程序前端代码
   - 包含页面、组件、工具函数等
   - 使用微信小程序框架开发

2. `scripts/`: 项目相关脚本
   - 包含部署、数据库初始化等脚本
   - 用于自动化项目维护任务

3. `server/`: 后端服务
   - `logs/`: 日志文件存储
   - `src/`: 源代码目录
     - `api/`: API 定义和路由
     - `config/`: 配置文件
     - `controllers/`: 控制器层，处理请求和响应
     - `middlewares/`: 中间件，处理通用逻辑
     - `models/`: 数据模型定义
     - `services/`: 业务逻辑层
     - `utils/`: 工具函数和辅助方法

### 代码分层说明

1. 路由层 (Routes)
   - 定义 API 端点
   - 处理 URL 映射

2. 控制器层 (Controllers)
   - 处理 HTTP 请求
   - 调用相应的服务
   - 返回 HTTP 响应

3. 服务层 (Services)
   - 实现业务逻辑
   - 调用数据模型
   - 处理数据转换

4. 模型层 (Models)
   - 定义数据结构
   - 处理数据库操作

5. 中间件层 (Middlewares)
   - 处理认证授权
   - 验证请求数据
   - 处理错误

6. 工具层 (Utils)
   - 提供通用功能
   - 处理日志记录
   - 提供辅助方法

## 前端注意事项

在`utils/request.js`的最上方记得修改后端服务器的地址

测试数据密码为123456



## 后端部署指南

### 环境要求

- Node.js >= 14.0.0
- MongoDB >= 4.4.0
- npm >= 6.14.0

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/zw021029/silc_robot.git
cd silc-qa/server
```

2. 安装依赖

```bash
npm install
```

3. 初始化数据库

在项目根目录下执行：
```bash
mongosh < ./scripts/init-db.js
```

4. 启动服务

在server目录下执行：
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```
