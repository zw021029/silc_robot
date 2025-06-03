const adminService = require('../services/adminService');
const { ApiError } = require('../utils/error');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/error');

class AdminController {
    // 管理员登录
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            
            logger.debug('=== 管理员登录请求开始 ===');
            logger.debug(`请求体: ${JSON.stringify(req.body)}`);
            logger.debug(`尝试登录: 用户名=${username}`);
            
            // 查找管理员用户
            const user = await User.findOne({ 
                username,
                role: { $in: ['admin', 'superadmin'] }
            });
            
            if (!user) {
                logger.warn(`管理员账号不存在: ${username}`);
                throw new AppError('管理员账号不存在', 401);
            }

            logger.debug(`找到管理员用户: id=${user._id}, 用户名=${user.username}, 角色=${user.role}`);
            logger.debug(`用户状态: ${user.status}`);

            // 检查用户状态
            if (user.status !== 'active') {
                logger.warn(`管理员账号已被禁用: ${username}`);
                throw new AppError('账号已被禁用', 403);
            }

            // 验证密码
            logger.debug('开始验证密码...');
            const isMatch = await user.comparePassword(password);
            logger.debug(`密码验证结果: ${isMatch ? '成功' : '失败'}`);

            if (!isMatch) {
                logger.warn(`密码验证失败: ${username}`);
                throw new AppError('密码错误', 401);
            }

            // 更新最后登录时间
            user.lastLogin = new Date();
            await user.save();
            logger.debug(`更新最后登录时间: ${user.lastLogin}`);

            // 生成token
            const token = user.generateToken();
            logger.debug('生成JWT token成功');
            logger.debug('=== 管理员登录请求结束 ===');

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        role: user.role,
                        nickname: user.nickname
                    }
                }
            });
        } catch (error) {
            logger.error('管理员登录失败:', error);
            next(error);
        }
    }

    // 获取用户列表
    async getUserList(req, res, next) {
        try {
            const { 
                page = 1, 
                pageSize = 10,
                search,
                username,
                nickname,
                role,
                status,
                email,
                registerStartDate,
                registerEndDate,
                updateStartDate,
                updateEndDate
            } = req.query;

            const query = {};

            // 构建查询条件
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { nickname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            if (username) {
                query.username = { $regex: username, $options: 'i' };
            }

            if (nickname) {
                query.nickname = { $regex: nickname, $options: 'i' };
            }

            if (role) {
                query.role = role;
            }

            if (status) {
                query.status = status;
            }

            if (email) {
                query.email = { $regex: email, $options: 'i' };
            }

            if (registerStartDate && registerEndDate) {
                query.createdAt = {
                    $gte: new Date(registerStartDate),
                    $lte: new Date(registerEndDate)
                };
            }

            if (updateStartDate && updateEndDate) {
                query.updatedAt = {
                    $gte: new Date(updateStartDate),
                    $lte: new Date(updateEndDate)
                };
            }

            const skip = (parseInt(page) - 1) * parseInt(pageSize);
            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .skip(skip)
                    .limit(parseInt(pageSize))
                    .sort({ createdAt: -1 }),
                User.countDocuments(query)
            ]);

            res.json({
                code: 0,
                data: {
                    list: users,
                    total,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                },
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取用户详情
    async getUserDetail(req, res, next) {
        try {
            const { userId } = req.params;
            const data = await adminService.getUserDetail(userId);
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // 更新用户状态
    async updateUserStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { status } = req.body;
            const data = await adminService.updateUserStatus(userId, status);
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // 获取知识库列表
    async getKnowledgeList(req, res, next) {
        try {
            const { page = 1, pageSize = 10, category, keyword } = req.query;
            const result = await adminService.getKnowledgeList(
                parseInt(page),
                parseInt(pageSize),
                category,
                keyword
            );
            res.json({
                code: 0,
                message: 'success',
                data: {
                    items: result.list,
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // 添加知识库条目
    async addKnowledge(req, res, next) {
        try {
            const { question, answer, category, tags } = req.body;
            const result = await adminService.addKnowledge(question, answer, category, tags);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // 更新知识库条目
    async updateKnowledge(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await adminService.updateKnowledge(id, data);
            res.json({
                code: 0,
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // 删除知识库条目
    async deleteKnowledge(req, res, next) {
        try {
            const { id } = req.params;
            const result = await adminService.deleteKnowledge(id);
            res.json({
                code: 0,
                success: true,
                message: '删除成功'
            });
        } catch (error) {
            next(error);
        }
    }

    // 处理文本文件并生成问答对
    async processTextFile(req, res, next) {
        try {
            if (!req.file) {
                throw new ApiError(400, '请上传文件');
            }
            const result = await adminService.processTextFile(req.file);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取统计数据
    async getStats(req, res, next) {
        try {
            const data = await adminService.getStats();
            res.json({
                code: 0,
                message: 'success',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取用户反馈列表
    async getFeedbackList(req, res, next) {
        try {
            const { page = 1, pageSize = 10, search, type, status, username, startDate, endDate } = req.query;
            const data = await adminService.getFeedbackList(
                parseInt(page),
                parseInt(pageSize),
                search,
                type,
                status,
                username,
                startDate,
                endDate
            );
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // 获取对话列表
    async getChatList(req, res, next) {
        try {
            const { page = 1, pageSize = 20, search, username, tag, startDate, endDate } = req.query;
            const data = await adminService.getChatList(
                parseInt(page),
                parseInt(pageSize),
                search,
                username,
                tag,
                startDate,
                endDate
            );
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // 获取对话详情
    async getChatDetail(req, res, next) {
        try {
            const { chatId } = req.params;
            const data = await adminService.getChatDetail(chatId);
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // 上传知识
    async uploadKnowledge(req, res, next) {
        try {
            const { title, content } = req.body;
            if (!title || !content) {
                throw new ApiError(400, '标题和内容不能为空');
            }
            
            const result = await adminService.uploadKnowledge({ title, content });
            res.json({
                code: 0,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // 重置用户密码
    async resetUserPassword(req, res, next) {
        try {
            const { userId } = req.params;
            const { password } = req.body;

            if (!password) {
                throw new ApiError(400, '新密码不能为空');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(404, '用户不存在');
            }

            // 直接设置新密码，让模型中间件处理加密
            user.password = password;
            await user.save();

            res.json({
                code: 0,
                message: '密码重置成功'
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取商品列表
    async getStoreItems(req, res, next) {
        try {
            const { page = 1, pageSize = 10 } = req.query;
            const result = await adminService.getStoreItems(parseInt(page), parseInt(pageSize));
            res.json({
                code: 0,
                data: result,
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 添加商品
    async addStoreItem(req, res, next) {
        try {
            const { name, points, description, image, stock } = req.body;
            const result = await adminService.addStoreItem({ name, points, description, image, stock });
            res.json({
                code: 0,
                data: result,
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 更新商品
    async updateStoreItem(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await adminService.updateStoreItem(id, data);
            res.json({
                code: 0,
                data: result,
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 删除商品
    async deleteStoreItem(req, res, next) {
        try {
            const { id } = req.params;
            const result = await adminService.deleteStoreItem(id);
            res.json({
                code: 0,
                data: result,
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取兑换记录
    async getExchangeRecords(req, res, next) {
        try {
            const { page = 1, pageSize = 10, search, startDate, endDate } = req.query;
            const data = await adminService.getExchangeRecords(
                parseInt(page),
                parseInt(pageSize),
                search,
                startDate,
                endDate
            );
            res.json({
                code: 0,
                data: data,
                message: 'success'
            });
        } catch (error) {
            next(error);
        }
    }

    // 通过兑换码核销
    async verifyByCode(req, res, next) {
        try {
            const { code } = req.body;
            if (!code) {
                throw new ApiError(400, '兑换码不能为空');
            }
            const result = await adminService.verifyByCode(code);
            res.json({
                code: 0,
                data: result,
                message: '核销成功'
            });
        } catch (error) {
            next(error);
        }
    }

    // 更新商品状态
    async updateStoreItemStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const data = await adminService.updateStoreItemStatus(id, status);
            const result = {
                code: 0,
                data: data,
                message: 'success'
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController; 