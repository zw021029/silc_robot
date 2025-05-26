# SILC Robot 服务器

基于Node.js和Express开发的后端服务器，提供RESTful API接口，处理机器人控制指令、数据存储和用户管理等功能。

## 功能特性

- RESTful API接口
- WebSocket实时通信
- 用户认证与授权
- MongoDB数据存储
- Redis缓存
- PostgreSQL数据存储
- 日志系统

## 系统要求

- Node.js 16+
- MongoDB 4.4+
- Redis 6+
- PostgreSQL 13+
- npm 6+

## 项目结构

```
server/
├── src/            # 源代码目录
│   ├── api/        # API路由
│   ├── config/     # 配置文件
│   ├── controllers/# 控制器
│   ├── models/     # 数据模型
│   ├── services/   # 业务逻辑
│   └── utils/      # 工具函数
├── logs/           # 日志文件
└── scripts/        # 脚本文件
```

## 安装步骤

### 确保已经安装了node npm
```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v22.16.0".
nvm current # Should print "v22.16.0".

# Verify npm version:
npm -v # Should print "10.9.2".

```

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp .env.example .env # 编辑.env文件，设置必要的环境变量
```

### 安装数据库

#### MongoDB

1. **导入 MongoDB 公开 GPG 密钥**：
   在终端中运行以下命令来确保软件包签名验证能够工作。
   ```bash
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor
   ```

2. **创建 MongoDB 列表文件**：

   ```bash
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
   ```

3. **更新本地包数据库**：
   更新你的包数据库：
   ```bash
   sudo apt-get update
   ```

4. **安装 MongoDB 包**：
   现在你可以安装 MongoDB：
   ```bash
   sudo apt-get install -y mongodb-org
   ```

5. **启动 MongoDB**：
   使用以下命令启动 MongoDB 服务：
   ```bash
   sudo systemctl start mongod
   ```

6. **设置开机自启**：
   如果希望 MongoDB 随系统启动自动运行，可以执行：
   ```bash
   sudo systemctl enable mongod
   ```

#### PostgreSQL
```bash
# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动PostgreSQL服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql -f scripts/pg-init.sql
```

#### Redis
```bash
# 安装Redis
sudo apt update
sudo apt install redis-server

# 启动Redis服务
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 使用 pm2 管理

#### 安装 PM2
npm install pm2 -g

#### 启动应用
pm2 start app.js

#### 查看应用状态
pm2 list

#### 停止/重启/删除应用
pm2 stop <app_name|id>
pm2 restart <app_name|id>
pm2 delete <app_name|id>

#### 日志查看
pm2 logs

#### 监控应用
pm2 monit

#### 设置开机自启
pm2 startup
pm2 save

## 数据库管理

### MongoDB数据导入导出

1. 导出数据
```bash
# 导出整个数据库
node scripts/export-mongo.js
```

2. 导入数据
```bash
# 导入整个数据库
node scripts/import-mongo.js
```

### PostgreSQL数据管理

1. 初始化数据库
```bash
sudo -u postgres psql -f scripts/init-pg.sql
```

2. 备份数据库
```bash
# 备份整个数据库
pg_dump -U postgres silc_robot > ./scripts/backup.sql
```

3. 恢复数据库
```bash
# 恢复整个数据库
psql -U postgres silc_robot < ./sql/backup.sql
```

## 使用方法

1. 启动开发服务器
```bash
npm run dev
```

2. 启动生产服务器
```bash
npm start
```
## 数据库设计

### MongoDB集合
- `users`: 用户信息
- `chats`: 用户对话记录
- `messages`: 对话消息
- `knowledgeactucles`: 知识库知识问答
- `pointstransactions`: 积分交易记录
- `robots`: 机器人信息
- `tasks`: 任务信息（未使用）
- `knowledgecategories`: 知识库分类（未使用）

### PostgreSQL表
- `exchange_records`: 交易记录
- `exchange_items`: 交易物品
- `feedback`: 用户反馈


## 部署说明

1. node项目需要把源码放到服务器上，所以现在服务器上`git pull`
2. 安装依赖 `npm install`
3. 配置环境变量 `.env`
4. 初始化数据库 `mongodb`, `redis`, `postgresql`，注意用户和密码的设置
5. 启动项目 `npm start dev`测试一下
6. 没有问题就用pm2管理进程，看日志用`pm2 logs`
7. 服务器端口记得在防火墙上打开