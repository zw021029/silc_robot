module.exports = {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '7d'
    },
    database: {
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/silc_qa'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  };