# 使用官方 Node.js 镜像（指定版本，推荐 LTS）
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖定义文件
COPY package*.json ./

# 安装生产依赖（禁用缓存以减少镜像层大小）
RUN npm install --production --no-optional && \
    npm cache clean --force

# 复制项目文件
COPY . .

# 暴露端口（与你的应用端口一致）
EXPOSE 3000

# 启动命令
CMD ["node", "src/app.js"]
