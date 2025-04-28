const db = require('../utils/database').pgPool;
const PointsTransaction = require('../models/points');
const User = require('../models/user');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// 提交反馈
exports.submitFeedback = async (req, res) => {
    try {
        const { content, contact_info, feedback_type } = req.body;
        const user_id = req.user.id;

        // 检查今日反馈次数是否达到上限
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayFeedbackCount = await db.query(
            'SELECT COUNT(*) FROM feedback WHERE user_id = $1 AND created_at >= $2',
            [user_id, today]
        );

        if (todayFeedbackCount.rows[0].count >= 10) {
            return res.status(400).json({
                success: false,
                message: '今天已经收到好多反馈啦，让思意休息一下，明天再来找我玩吧~ (｡•ᴗ•｡)'
            });
        }

        // 检查今日反馈积分是否达到上限
        const todayPointsCount = await PointsTransaction.countDocuments({
            userId: mongoose.Types.ObjectId(user_id),
            type: 'earn',
            sourceType: 'feedback',
            createdAt: { $gte: today }
        });

        // 开始事务
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 插入反馈记录
            const result = await db.query(
                'INSERT INTO feedback (user_id, content, contact_info, feedback_type) VALUES ($1, $2, $3, $4) RETURNING *',
                [user_id, content, contact_info, feedback_type]
            );

            let pointsEarned = 0;
            let newPoints = 0;

            // 如果未达到积分上限，则添加积分
            if (todayPointsCount < 4) {
                // 获取用户信息
                const user = await User.findById(user_id);
                if (!user) {
                    throw new Error('用户不存在');
                }

                // 更新用户积分
                newPoints = (user.points || 0) + 2;
                await User.findByIdAndUpdate(user_id, { points: newPoints });

                // 创建积分交易记录
                const pointsTransaction = new PointsTransaction({
                    userId: user_id,
                    type: 'earn',
                    amount: 2,
                    balance: newPoints,
                    sourceType: 'feedback',
                    sourceId: null,
                    sourceModel: 'Feedback',
                    description: '提交反馈获得2积分',
                    metadata: {
                        feedbackId: result.rows[0].id,
                        feedbackType: feedback_type
                    }
                });
                await pointsTransaction.save();

                pointsEarned = 2;
            }

            await session.commitTransaction();
            session.endSession();

            res.json({
                success: true,
                data: {
                    feedback: result.rows[0],
                    points: {
                        earned: pointsEarned,
                        total: newPoints || (await User.findById(user_id)).points || 0
                    },
                    message: pointsEarned > 0 ? 
                        '感谢你的反馈，获得2积分奖励！(◕‿◕✿)' : 
                        '感谢你的反馈！虽然今天积分已经领完啦，但你的意见对我们依然很重要哦~ (｡♥‿♥｡)'
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        logger.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: '提交反馈失败，请稍后再试~ (｡•́︿•̀｡)'
        });
    }
};

// 获取反馈列表（管理员用）
exports.getFeedbackList = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT f.*, u.username FROM feedback f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting feedback list:', error);
        res.status(500).json({
            success: false,
            message: '获取反馈列表失败'
        });
    }
};


