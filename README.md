# SILC Robot 项目

SILC Robot 是一个集成了多个组件的智能机器人系统，包括微信小程序客户端、Node.js服务器和Vue网站三个主要部分。

## 项目结构

- [client/](client/README.md) - 微信小程序客户端
- [server/](server/README.md) - Node.js后端服务器
- [website/](website/README.md) - Vue.js前端网站

## 技术栈

- **客户端**: 微信小程序
- **服务器**: Node.js, Express, MongoDB
- **网站**: Vue.js, TypeScript, Vite

## 快速开始

1. 克隆仓库
```bash
git clone https://github.com/zw021029/silc_robot.git
cd silc_robot
```

2. 安装依赖
```bash
# 安装服务器依赖
cd server
npm install

# 安装网站依赖
cd ../website
npm install
```

3. 运行项目
```bash
# 启动服务器
cd server
npm run dev

# 启动网站开发服务器
cd ../website
npm run dev
```

## 项目说明

### 微信小程序客户端
- 使用微信小程序原生框架开发
- 提供用户界面和机器人控制功能
- 支持实时通信和状态监控

### Node.js服务器
- 基于Express框架开发
- 使用MongoDB存储数据
- 提供RESTful API接口
- 支持WebSocket实时通信

### Vue网站
- 基于Vue 3和TypeScript开发
- 使用Vite作为构建工具
- 提供管理后台和监控界面

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
