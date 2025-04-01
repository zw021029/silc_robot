const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// 清理临时文件
exports.cleanupTempFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = fs.readdirSync(uploadsDir);
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      // 删除超过24小时的临时文件
      if (Date.now() - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        logger.info(`已删除临时文件: ${file}`);
      }
    }
  } catch (error) {
    logger.error('清理临时文件失败:', error);
    throw error;
  }
};

// 清理导出文件
exports.cleanupExportFiles = async () => {
  try {
    const exportsDir = path.join(__dirname, '../../exports');
    const files = fs.readdirSync(exportsDir);
    
    for (const file of files) {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      // 删除超过7天的导出文件
      if (Date.now() - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        logger.info(`已删除导出文件: ${file}`);
      }
    }
  } catch (error) {
    logger.error('清理导出文件失败:', error);
    throw error;
  }
};

// 清理日志文件
exports.cleanupLogFiles = async () => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    const files = fs.readdirSync(logsDir);
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      // 删除超过30天的日志文件
      if (Date.now() - stats.mtime.getTime() > 30 * 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        logger.info(`已删除日志文件: ${file}`);
      }
    }
  } catch (error) {
    logger.error('清理日志文件失败:', error);
    throw error;
  }
};

// 定期清理任务
exports.startCleanupTask = () => {
  // 每天凌晨2点执行清理
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    2, 0, 0
  );
  const msToMidnight = night.getTime() - now.getTime();
  
  // 首次执行
  setTimeout(async () => {
    try {
      await exports.cleanupTempFiles();
      await exports.cleanupExportFiles();
      await exports.cleanupLogFiles();
      logger.info('文件清理任务完成');
    } catch (error) {
      logger.error('文件清理任务失败:', error);
    }
    
    // 设置每天执行
    setInterval(async () => {
      try {
        await exports.cleanupTempFiles();
        await exports.cleanupExportFiles();
        await exports.cleanupLogFiles();
        logger.info('文件清理任务完成');
      } catch (error) {
        logger.error('文件清理任务失败:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }, msToMidnight);
}; 