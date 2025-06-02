-- sudo -u postgres psql -f pq_init.sql

-- 如果存在同名数据库则删除
DROP DATABASE IF EXISTS silc_robot;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

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

-- 创建反馈表
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    contact_info TEXT,
    type VARCHAR(50) DEFAULT 'bug' CHECK (type IN ('bug', 'feature', 'other')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved'))
); 

-- 插入示例数据
-- INSERT INTO exchange_items (name, points, description, image, stock) VALUES
-- ('思意AI月卡', 500, '畅享思意AI高级功能一个月', '/assets/images/items/monthly-card.png', 100),
-- ('AI个性化形象定制', 1000, '专业AI定制专属于您的个性化形象', '/assets/images/items/avatar-customize.png', 50),
-- ('思意AI知识库定制', 2000, '根据您的需求定制专属知识库', '/assets/images/items/knowledge-base.png', 30),
-- ('思意AI年度会员', 5000, '全年畅享思意AI高级功能', '/assets/images/items/annual-member.png', 20);

INSERT INTO exchange_items (name, points, description, image, stock, created_at, updated_at, status) VALUES 
('伊利金典纯牛奶整箱 250ml*16盒', 380, '伊利金典纯牛奶整箱 250ml*16盒 3.6g乳蛋白 礼盒装【2月产】', 'https://img11.360buyimg.com/n5/s114x114_jfs/t1/187912/18/39601/71653/65227268F616ea575/73771a2d2a4e663d.jpg.avif', 30, '2025-05-01 17:39:04.630009', '2025-05-01 17:39:04.630009', 'active');

INSERT INTO exchange_items (name, points, description, image, stock, created_at, updated_at, status) VALUES 
('好丽友（orion）巧克力派12枚', 170, '好丽友（orion）巧克力派12枚445g 营养早餐面包夹心蛋糕点心休闲零食解馋', 'https://img14.360buyimg.com/n5/s114x114_jfs/t1/278467/38/27912/192505/681073f1F810df0fa/370f7999025b4c56.jpg.avif', 20, '2025-05-01 17:40:20.273104', '2025-05-01 17:40:20.273104', 'active');

INSERT INTO exchange_items (name, points, description, image, stock, created_at, updated_at, status) VALUES 
('小悉定制明信片10张', 20, '悉尼工商学院周年庆明信片', 'https://img12.360buyimg.com/n5/s720x720_jfs/t1/222552/26/47118/232050/673d7cacF1c0e1788/896932ae0885d8e4.jpg.avif', 50, '2025-05-01 17:42:03.715662', '2025-05-01 17:42:03.715662', 'active');
