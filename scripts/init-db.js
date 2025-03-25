// 连接MongoDB
db = db.getSiblingDB('silc_qa');

// 创建集合
db.createCollection('users');
db.createCollection('chats');
db.createCollection('robots');
db.createCollection('points');
db.createCollection('knowledge');
db.createCollection('rewards');

// 创建索引
db.users.createIndex({ "username": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "phone": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "openid": 1 }, { unique: true, sparse: true });

// 插入测试数据
// 1. 插入管理员用户
db.users.insertOne({
  username: "admin",
  password: "$2b$10$24EJiM8/LxJCoOUbQ45PLuVb5DBh8Y9M.k9CnjvqV7ZIih8RAY5eK", // 使用bcrypt生成的密码哈希
  nickname: "系统管理员",
  role: "admin",
  points: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. 插入测试用户
db.users.insertMany([
  {
    username: "test_user1",
    password: "$2b$10$24EJiM8/LxJCoOUbQ45PLuVb5DBh8Y9M.k9CnjvqV7ZIih8RAY5eK",
    nickname: "测试用户1",
    phone: "13800138001",
    role: "user",
    points: 100,
    selectedRobot: "xiwen",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: "test_user2",
    password: "$2b$10$24EJiM8/LxJCoOUbQ45PLuVb5DBh8Y9M.k9CnjvqV7ZIih8RAY5eK",
    nickname: "测试用户2",
    phone: "13800138002",
    role: "user",
    points: 200,
    selectedRobot: "xihui",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 3. 插入机器人数据
db.robots.insertMany([
  {
    name: "悉文",
    type: "xiwen",
    personality: {
      style: "专业",
      tone: "严谨",
      characteristics: ["理性", "专业", "严谨"]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "悉荟",
    type: "xihui",
    personality: {
      style: "亲和",
      tone: "温暖",
      characteristics: ["温柔", "贴心", "活泼"]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 4. 插入积分奖励数据
db.rewards.insertMany([
  {
    name: "优惠券-10元",
    description: "可用于校内商铺消费",
    points: 100,
    stock: 1000,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "纪念徽章",
    description: "限量版校徽徽章",
    points: 500,
    stock: 100,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("数据库初始化完成！");