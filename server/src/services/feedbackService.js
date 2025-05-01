const { Pool } = require('pg');
const logger = require('../utils/logger');

// PostgreSQL连接配置
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

class FeedbackService {
    async submitFeedback(userId, content, contactInfo, type = 'bug') {
        try {
            // 清理user_id
            const cleanUserId = userId.replace(/"/g, '').trim();
            
            const query = {
                text: `
                    INSERT INTO feedback (user_id, content, contact_info, type)
                    VALUES ($1::varchar, $2, $3, $4)
                    RETURNING *
                `,
                values: [cleanUserId, content, contactInfo, type]
            };
            
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            logger.error('提交反馈失败:', error);
            throw error;
        }
    }
}

module.exports = new FeedbackService(); 