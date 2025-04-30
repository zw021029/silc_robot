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
    async getStats(startDate, endDate) {
        const [userCount, chatCount, knowledgeCount] = await Promise.all([
            User.countDocuments(),
            Chat.countDocuments(),
            Knowledge.countDocuments()
        ]);

        const feedbackQuery = `
            SELECT COUNT(*) as total, 
                   COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
            FROM feedback
            WHERE created_at BETWEEN $1 AND $2
        `;
        const feedbackResult = await pool.query(feedbackQuery, [startDate, endDate]);

        return {
            userCount,
            chatCount,
            knowledgeCount,
            feedback: feedbackResult.rows[0]
        };
    }

    // 获取用户反馈列表
    async getFeedbackList(page, pageSize) {
        const offset = (page - 1) * pageSize;
        const query = `
            SELECT * FROM feedback
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        const countQuery = 'SELECT COUNT(*) FROM feedback';

        const [result, countResult] = await Promise.all([
            pool.query(query, [pageSize, offset]),
            pool.query(countQuery)
        ]);

        return {
            list: result.rows,
            total: parseInt(countResult.rows[0].count),
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
    async getChatList(page, pageSize, search, status) {
        const query = {};

        // 构建查询条件
        if (search) {
            query.$or = [
                { 'userMessage.content': { $regex: search, $options: 'i' } },
                { 'robotReply.content': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        // 执行查询
        const [chats, total] = await Promise.all([
            Chat.find(query)
                .populate('userId', 'username nickname')
                .populate('userMessage')
                .populate('robotReply')
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize),
            Chat.countDocuments(query)
        ]);

        // 格式化返回数据
        const formattedChats = chats.map(chat => ({
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
}

module.exports = new AdminService(); 