const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user');
const config = require('../config');

async function resetAdminPassword() {
    try {
        // 连接数据库
        await mongoose.connect(config.database.url, config.database.options);
        console.log('数据库连接成功');

        // 生成加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123123', salt);
        console.log('加密后的密码:', hashedPassword);

        // 更新管理员密码
        const result = await User.updateMany(
            { 
                username: { $in: ['admin', 'superadmin'] },
                role: { $in: ['admin', 'superadmin'] }
            },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );

        console.log('更新结果:', result);
        console.log('管理员密码已重置为: 123123');

    } catch (error) {
        console.error('重置密码失败:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
}

// 执行脚本
resetAdminPassword(); 