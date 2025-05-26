const User = require('../models/user');
const Chat = require('../models/chat');
const { KnowledgeArticle: Knowledge } = require('../models/knowledge');
const Message = require('../models/message');
const { ApiError } = require('../utils/error');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { Pool } = require('pg');
const { processTextToQA } = require('./openai');
const logger = require('../utils/logger');
const { useDefault, Segment } = require('segmentit');
const stopwords = require('stopwords-zh');

const segmentit = useDefault(new Segment());

// PostgreSQL连接配置
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

class AdminService {
    // 获取对话历史
    async getChatHistory(page, pageSize, startDate, endDate, userId) {
        const query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (userId) {
            query.userId = userId;
        }

        const [messages, total] = await Promise.all([
            Message.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('userId', 'username nickname'),
            Message.countDocuments(query)
        ]);

        return {
            list: messages,
            total,
            page,
            pageSize
        };
    }

    // 获取用户列表
    async getUserList(page, pageSize) {
        const skip = (page - 1) * pageSize;
        const [users, total] = await Promise.all([
            User.find().skip(skip).limit(pageSize).select('-password'),
            User.countDocuments()
        ]);

        return {
            list: users,
            total,
            page,
            pageSize
        };
    }

    // 获取用户详情
    async getUserDetail(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new ApiError(404, '用户不存在');
        }
        return user;
    }

    // 更新用户状态
    async updateUserStatus(userId, status) {
        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('-password');

        if (!user) {
            throw new ApiError(404, '用户不存在');
        }

        return user;
    }

    // 获取知识库列表
    async getKnowledgeList(page, pageSize, category, keyword) {
        const query = {};

        if (category) {
            query.category = category;
        }
        if (keyword) {
            query.$or = [
                { title: new RegExp(keyword, 'i') },
                { content: new RegExp(keyword, 'i') }
            ];
        }

        const [knowledge, total] = await Promise.all([
            Knowledge.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize),
            Knowledge.countDocuments(query)
        ]);

        return {
            list: knowledge,
            total,
            page,
            pageSize
        };
    }

    // 添加知识库条目
    async addKnowledge(title, content, category, tags) {
        const knowledge = new Knowledge({
            title,
            content,
            category,
            tags,
            robotName: 'all',
            status: 'active'
        });
        await knowledge.save();
        return knowledge;
    }

    // 更新知识库条目
    async updateKnowledge(id, data) {
        const knowledge = await Knowledge.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true }
        );

        if (!knowledge) {
            throw new ApiError(404, '知识库不存在');
        }

        return knowledge;
    }

    // 删除知识库条目
    async deleteKnowledge(id) {
        const knowledge = await Knowledge.findByIdAndDelete(id);
        if (!knowledge) {
            throw new ApiError(404, '知识库不存在');
        }
        return { message: '删除成功' };
    }

    // 处理文本文件并生成问答对
    async processTextFile(file) {
        if (!file) {
            throw new ApiError(400, '请上传文件');
        }

        const text = file.buffer.toString('utf-8');
        const qaPairs = await processTextToQA(text);

        const knowledgeList = await Knowledge.insertMany(
            qaPairs.map(qa => ({
                question: qa.question,
                answer: qa.answer,
                category: 'auto_generated',
                tags: ['auto_generated']
            }))
        );

        return {
            count: knowledgeList.length,
            knowledgeList
        };
    }

    // 获取统计数据
    async getStats() {
        try {
            // 获取基础统计数据
            const [userCount, chatCount, knowledgeCount] = await Promise.all([
                User.countDocuments(),
                Chat.countDocuments(),
                Knowledge.countDocuments()
            ]);

            // 获取热门问题
            const hotQuestions = await Message.aggregate([
                {
                    $match: {
                        type: 'user'  // 只匹配用户发送的消息
                    }
                },
                {
                    $group: {
                        _id: '$content',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        _id: 0,
                        question: '$_id',
                        count: 1
                    }
                }
            ]);

            // 计算最近15天的问答趋势
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const chatTrends = await Chat.aggregate([
                {
                    $match: {
                        createdAt: { $gte: fifteenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                }
            ]);

            // 计算知识库分布
            const knowledgeDistribution = await Knowledge.aggregate([
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 }
                    }
                }
            ]);

            // 计算用户反馈分析
            const feedbackAnalysis = await pool.query(`
                SELECT 
                    type as type,
                    COUNT(*) as count
                FROM feedback
                WHERE created_at >= $1
                GROUP BY type
            `, [fifteenDaysAgo]);

            // 计算反馈总数
            const feedbackCount = await pool.query(`
                SELECT COUNT(*) as total
                FROM feedback
            `);

            // 词云图
            const chatKeywords = await this.getChatKeywords();

            // 返回数据
            return {
                knowledgeCount,
                chatCount,
                userCount,
                feedbackCount: parseInt(feedbackCount.rows[0].total),
                chatTrends: chatTrends.map(trend => ({
                    day: `${trend._id.year}-${trend._id.month}-${trend._id.day}`,
                    count: trend.count
                })),
                knowledgeDistribution: knowledgeDistribution.map(dist => ({
                    name: dist._id,
                    value: dist.count
                })),
                feedbackAnalysis: feedbackAnalysis.rows.map(feedback => ({
                    name: feedback.type,
                    value: feedback.count
                })),
                chatKeywords: chatKeywords,
                hotQuestions: hotQuestions
            };
        } catch (error) {
            logger.error('获取统计数据失败:', error);
            throw error;
        }
    }

    async getChatKeywords() {
        try {
            // 获取最近30天的对话
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentChats = await Chat.find({
                createdAt: { $gte: thirtyDaysAgo }
            })
                .populate('userMessage')
                .populate('robotReply');

            // 拼接所有对话文本
            const allText = recentChats
                .map(c => `${c.userMessage?.content || ''} ${c.robotReply?.content || ''}`)
                .join(' ');

            const rawTokens = segmentit.doSegment(allText).map(t => t.w);

            const tokens = rawTokens
                .map(w => w.trim())
                .filter(w =>
                    w.length > 1 &&
                    !stopwords.includes(w) &&
                    !/^[\d\p{P}\s]+$/u.test(w)
                );

            const freq = {};
            tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1 });

            return Object.entries(freq)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 100);
        } catch (error) {
            logger.error('获取问答关键词数据失败:', error);
            throw error;
        }
    }

    // 处理user_id中的双引号
    cleanUserId(userId) {
        if (!userId) return userId;
        // 移除双引号并清理可能的空白字符
        return userId.replace(/"/g, '').trim();
    }

    // 获取用户反馈列表
    async getFeedbackList(page, pageSize, search, type, status, username, startDate, endDate) {
        const offset = (page - 1) * pageSize;
        let query = {
            text: `
                SELECT 
                    f.*
                FROM feedback f
                WHERE 1=1
            `,
            values: []
        };
        let paramCount = 1;

        if (search) {
            query.text += ` AND f.content ILIKE $${paramCount}`;
            query.values.push(`%${search}%`);
            paramCount++;
        }

        if (type) {
            query.text += ` AND f.type = $${paramCount}::varchar`;
            query.values.push(type);
            paramCount++;
        }

        if (status) {
            query.text += ` AND f.status = $${paramCount}::varchar`;
            query.values.push(status);
            paramCount++;
        }

        if (startDate && endDate) {
            query.text += ` AND f.created_at BETWEEN $${paramCount} AND $${paramCount + 1}`;
            query.values.push(startDate, endDate);
            paramCount += 2;
        }

        query.text += ` ORDER BY f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        query.values.push(pageSize, offset);

        const countQuery = {
            text: query.text.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0],
            values: query.values.slice(0, -2)
        };

        const [result, countResult] = await Promise.all([
            pool.query(query),
            pool.query(countQuery)
        ]);

        // 获取所有用户ID，处理带双引号的情况
        const userIds = result.rows.map(row => this.cleanUserId(row.user_id));

        const users = await User.find({ _id: { $in: userIds } }).select('username');
        const userMap = new Map(users.map(user => [user._id.toString(), user.username]));

        // 合并用户信息
        const feedbackList = result.rows.map(row => ({
            ...row,
            user_id: this.cleanUserId(row.user_id),
            username: userMap.get(this.cleanUserId(row.user_id)) || '未知用户'
        }));

        return {
            list: feedbackList,
            total: countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0,
            page,
            pageSize
        };
    }

    async uploadKnowledge(data) {
        try {
            const { title, content } = data;
            if (!title || !content) {
                throw new ApiError(400, '标题和内容不能为空');
            }

            const knowledge = new Knowledge({
                title,
                content,
                robotName: 'all',
                category: '默认分类',
                tags: [],
                status: 'active',
                embeddings: true,
                vector: {}
            });

            await knowledge.save();
            return knowledge;
        } catch (error) {
            throw new ApiError(500, '上传知识失败');
        }
    }

    // 获取对话列表
    async getChatList(page, pageSize, search, username, tag, startDate, endDate) {
        const query = {};

        // 构建查询条件
        if (search) {
            // 先在messages集合中查找包含搜索词的消息
            const matchedMessages = await Message.find({
                content: { $regex: search, $options: 'i' }
            }).select('_id');

            const matchedIds = matchedMessages.map(m => m._id);

            query.$or = [
                { userMessage: { $in: matchedIds } },
                { robotReply: { $in: matchedIds } }
            ];
        }

        if (username) {
            const users = await User.find({ username: { $regex: username, $options: 'i' } });
            const userIds = users.map(user => user._id);
            query.userId = { $in: userIds };
        }

        if (tag) {
            query.tag = tag;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 执行查询
        const [chats, total] = await Promise.all([
            Chat.find(query)
                .populate('userId', 'username nickname')
                .populate({
                    path: 'userMessage',
                    select: 'content'
                })
                .populate({
                    path: 'robotReply',
                    select: 'content'
                })
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize),
            Chat.countDocuments(query)
        ]);

        // 格式化返回数据
        const formattedChats = chats.map(chat => ({
            id: chat._id,
            username: chat.userId?.username || '未知用户',
            userId: chat.userId,
            robotId: chat.robotId,
            question: chat.userMessage?.content || '',
            answer: chat.robotReply?.content || '',
            tag: chat.tag || '',
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            duration: chat.duration || 0,
            knowledgeBase: chat.knowledgeBase,
            error: chat.error
        }));

        return {
            items: formattedChats,
            total,
            page,
            pageSize
        };
    }


    // 获取对话详情
    async getChatDetail(chatId) {
        try {
            const chat = await Chat.findById(chatId)
                .populate('userMessage')
                .populate('robotReply')
                .populate('userId', 'username nickname');

            if (!chat) {
                throw new ApiError(404, '对话不存在');
            }

            // 格式化返回数据
            return {
                id: chat._id,
                userId: chat.userId,
                robotId: chat.robotId,
                question: chat.userMessage?.content || '',
                answer: chat.robotReply?.content || '',
                status: chat.status || 'success',
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                duration: chat.duration || 0,
                knowledgeBase: chat.knowledgeBase,
                error: chat.error
            };
        } catch (error) {
            logger.error('获取对话详情失败:', error);
            throw error;
        }
    }

    // 获取商品列表
    async getStoreItems(page, pageSize) {
        try {
            const offset = (page - 1) * pageSize;
            const query = {
                text: 'SELECT * FROM exchange_items ORDER BY created_at DESC LIMIT $1 OFFSET $2',
                values: [pageSize, offset]
            };
            const countQuery = {
                text: 'SELECT COUNT(*) FROM exchange_items'
            };

            const [result, countResult] = await Promise.all([
                pool.query(query),
                pool.query(countQuery)
            ]);

            return {
                items: result.rows,
                total: parseInt(countResult.rows[0].count),
                page,
                pageSize
            };
        } catch (error) {
            logger.error('获取商品列表失败:', error);
            throw error;
        }
    }

    // 添加商品
    async addStoreItem(data) {
        try {
            const { name, points, description, image, stock } = data;
            const query = {
                text: `
                    INSERT INTO exchange_items (name, points, description, image, stock)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `,
                values: [name, points, description, image, stock]
            };

            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            logger.error('添加商品失败:', error);
            throw error;
        }
    }

    // 更新商品
    async updateStoreItem(id, data) {
        try {
            const { name, points, description, image, stock } = data;
            const query = {
                text: `
                    UPDATE exchange_items
                    SET name = $1, points = $2, description = $3, image = $4, stock = $5, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $6
                    RETURNING *
                `,
                values: [name, points, description, image, stock, id]
            };

            const result = await pool.query(query);
            if (result.rows.length === 0) {
                throw new ApiError(404, '商品不存在');
            }
            return result.rows[0];
        } catch (error) {
            logger.error('更新商品失败:', error);
            throw error;
        }
    }

    // 删除商品
    async deleteStoreItem(id) {
        try {
            // 检查是否有兑换记录
            const checkQuery = {
                text: 'SELECT COUNT(*) FROM exchange_records WHERE item_id = $1',
                values: [id]
            };
            const checkResult = await pool.query(checkQuery);
            const hasRecords = parseInt(checkResult.rows[0].count) > 0;

            if (hasRecords) {
                // 如果有兑换记录，则下架商品
                const updateQuery = {
                    text: 'UPDATE exchange_items SET status = $1 WHERE id = $2 RETURNING *',
                    values: ['inactive', id]
                };
                const result = await pool.query(updateQuery);
                if (result.rows.length === 0) {
                    throw new ApiError(404, '商品不存在');
                }
                return { message: '该商品已有兑换记录，已自动下架', hasRecords: true };
            } else {
                // 如果没有兑换记录，则删除商品
                const deleteQuery = {
                    text: 'DELETE FROM exchange_items WHERE id = $1 RETURNING *',
                    values: [id]
                };
                const result = await pool.query(deleteQuery);
                if (result.rows.length === 0) {
                    throw new ApiError(404, '商品不存在');
                }
                return { message: '商品已删除', hasRecords: false };
            }
        } catch (error) {
            logger.error('操作商品失败:', error);
            throw error;
        }
    }

    // 获取兑换记录
    async getExchangeRecords(page, pageSize, search, startDate, endDate) {
        try {
            const offset = (page - 1) * pageSize;
            // 不要返回redeem_code
            let query = {
                text: `
                    SELECT r.order_no, r.created_at, r.is_redeemed, r.redeemed_at, i.name as item_name, i.points as item_points
                    FROM exchange_records r
                    JOIN exchange_items i ON r.item_id = i.id
                `,
                values: []
            };
            let paramCount = 1;

            if (search) {
                query.text += ` AND r.order_no ILIKE $${paramCount}`;
                query.values.push(`%${search}%`);
                paramCount++;
            }

            if (startDate && endDate) {
                query.text += ` AND r.created_at BETWEEN $${paramCount} AND $${paramCount + 1}`;
                query.values.push(startDate, endDate);
                paramCount += 2;
            }

            query.text += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            query.values.push(pageSize, offset);

            const countQuery = {
                text: query.text.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0],
                values: query.values.slice(0, -2)
            };

            const [result, countResult] = await Promise.all([
                pool.query(query),
                pool.query(countQuery)
            ]);

            // 获取未核销商品的统计
            const statsQuery = {
                text: `
                    SELECT i.name, COUNT(*) as count
                    FROM exchange_records r
                    JOIN exchange_items i ON r.item_id = i.id
                    WHERE r.is_redeemed = false
                    GROUP BY i.name
                `,
            };
            const statsResult = await pool.query(statsQuery);

            return {
                items: result.rows,
                total: countResult.rows[0]?.count ? parseInt(countResult.rows[0].count) : 0,
                page,
                pageSize,
                pendingStats: statsResult.rows
            };
        } catch (error) {
            logger.error('获取兑换记录失败:', error);
            throw error;
        }
    }

    // 通过兑换码核销
    async verifyByCode(code) {
        try {
            const query = {
                text: `
                    UPDATE exchange_records
                    SET is_redeemed = true, redeemed_at = CURRENT_TIMESTAMP
                    WHERE redeem_code = $1 AND is_redeemed = false
                    RETURNING *, (SELECT name FROM exchange_items WHERE id = exchange_records.item_id) as item_name
                `,
                values: [code]
            };

            const result = await pool.query(query);
            if (result.rows.length === 0) {
                // 检查兑换码是否存在且已被核销
                const checkQuery = {
                    text: `
                        SELECT order_no, is_redeemed
                        FROM exchange_records
                        WHERE redeem_code = $1
                    `,
                    values: [code]
                };
                const checkResult = await pool.query(checkQuery);
                
                if (checkResult.rows.length === 0) {
                    throw new ApiError(404, '兑换码不存在');
                } else if (checkResult.rows[0].is_redeemed) {
                    throw new ApiError(400, `该兑换码已被核销，订单号：${checkResult.rows[0].order_no}`);
                }
            }
            return result.rows[0];
        } catch (error) {
            logger.error('核销兑换码失败:', error);
            throw error;
        }
    }

    // 更新商品状态
    async updateStoreItemStatus(id, status) {
        try {
            const query = {
                text: 'UPDATE exchange_items SET status = $1 WHERE id = $2 RETURNING *',
                values: [status, id]
            };

            const result = await pool.query(query);
            if (result.rows.length === 0) {
                throw new ApiError(404, '商品不存在');
            }
            return result.rows[0];
        } catch (error) {
            logger.error('更新商品状态失败:', error);
            throw error;
        }
    }
}

module.exports = new AdminService(); 