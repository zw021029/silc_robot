-- 创建数据库
CREATE DATABASE silc_robot;

-- 连接到数据库
\c silc_robot

-- 创建兑换商品表
CREATE TABLE exchange_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    image VARCHAR(255),
    stock INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO exchange_items (name, points, description, image, stock) VALUES
('思意AI月卡', 500, '畅享思意AI高级功能一个月', '/assets/images/items/monthly-card.png', 100),
('AI个性化形象定制', 1000, '专业AI定制专属于您的个性化形象', '/assets/images/items/avatar-customize.png', 50),
('思意AI知识库定制', 2000, '根据您的需求定制专属知识库', '/assets/images/items/knowledge-base.png', 30),
('思意AI年度会员', 5000, '全年畅享思意AI高级功能', '/assets/images/items/annual-member.png', 20);

-- 创建兑换记录表
CREATE TABLE exchange_records (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    item_id INTEGER NOT NULL REFERENCES exchange_items(id),
    redeem_code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP
);