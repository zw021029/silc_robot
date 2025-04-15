const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/user');
const logger = require('../utils/logger');

async function migrateRobotNames() {
  try {
    // 连接数据库
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('数据库连接成功');

    // 更新所有用户的selectedRobot值
    const result = await User.updateMany(
      { selectedRobot: 'xiwen' },
      { $set: { selectedRobot: '悉文' } }
    );
    logger.info(`更新悉文用户数: ${result.modifiedCount}`);

    const result2 = await User.updateMany(
      { selectedRobot: 'xihui' },
      { $set: { selectedRobot: '悉荟' } }
    );
    logger.info(`更新悉荟用户数: ${result2.modifiedCount}`);

    // 关闭数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');

    process.exit(0);
  } catch (error) {
    logger.error('迁移失败:', error);
    process.exit(1);
  }
}

migrateRobotNames(); 