const Message = require('../models/message');
const mongoose = require('mongoose');

// 获取热门问题
exports.getHotQuestions = async () => {
    try {
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
                $limit: 3
            },
            {
                $project: {
                    _id: 0,
                    question: '$_id',
                    count: 1
                }
            }
        ]);

        return hotQuestions;
    } catch (error) {
        throw new Error('获取热门问题失败');
    }
}; 