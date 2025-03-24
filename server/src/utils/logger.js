const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// 创建 logger 实例
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 错误日志文件
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 所有日志文件
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});

// 非生产环境下添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

// 添加自定义日志级别方法
const customLogger = {
    error: (message, meta = {}) => {
        logger.error(message, { ...meta, timestamp: new Date() });
    },
    warn: (message, meta = {}) => {
        logger.warn(message, { ...meta, timestamp: new Date() });
    },
    info: (message, meta = {}) => {
        logger.info(message, { ...meta, timestamp: new Date() });
    },
    debug: (message, meta = {}) => {
        logger.debug(message, { ...meta, timestamp: new Date() });
    },
    // 添加请求日志方法
    logRequest: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info('HTTP Request', {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
        });
        next();
    },
    // 添加错误日志方法
    logError: (err, req, res, next) => {
        logger.error('Server Error', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
        });
        next(err);
    },
};

module.exports = customLogger;
