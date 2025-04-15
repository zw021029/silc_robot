const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 机器人模型
const robotSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '/assets/images/default-avatar.png'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  features: [String],
  personality: {
    type: String,
    default: '友好'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  model: {
    type: String,
    required: true,
    default: 'gpt-3.5-turbo'
  },
  systemPrompt: {
    type: String,
    required: true,
    default: '你是悉商商学院的智能助手，请耐心回答用户的问题。'
  },
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    min: 100,
    max: 4096,
    default: 2000
  },
  topP: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.9
  },
  frequencyPenalty: {
    type: Number,
    min: 0,
    max: 2,
    default: 0
  },
  presencePenalty: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.6
  },
  voiceSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    voiceId: {
      type: String,
      default: 'cmn-CN-YunxiNeural'
    },
    speed: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    }
  },
  imageSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    maxSize: {
      type: Number,
      default: 5 * 1024 * 1024 // 5MB
    },
    allowedTypes: {
      type: [String],
      default: ['image/jpeg', 'image/png']
    }
  },
  pointsPerInteraction: {
    type: Number,
    default: 1,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 更新时间的中间件
robotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 创建索引
robotSchema.index({ name: 1 });
robotSchema.index({ status: 1 });

// 添加默认机器人数据的方法
robotSchema.statics.createDefaultRobots = async function() {
  const count = await this.countDocuments();
  if (count === 0) {
    try {
      await this.create([
        {
          name: '悉文',
          displayName: '悉文',
          description: '悉文是一位友好、热情、有责任心的虚拟助手，擅长学业辅导和日常交流。',
          avatar: '/assets/images/xiwen.png',
          status: 'active',
          features: ['学业辅导', '日常交流', '校园指南'],
          personality: '友好、热情、有责任心'
        },
        {
          name: '悉荟',
          displayName: '悉荟',
          description: '悉荟是一位温柔、细心、有耐心的虚拟助手，擅长情感交流和生活指导。',
          avatar: '/assets/images/xihui.png',
          status: 'active',
          features: ['情感交流', '生活指导', '心理辅导'],
          personality: '温柔、细心、有耐心'
        }
      ]);
      console.log('成功创建默认机器人数据');
    } catch (error) {
      console.error('创建默认机器人数据失败:', error);
    }
  }
};

const Robot = mongoose.model('Robot', robotSchema);

// 导出时执行创建默认机器人的方法
Robot.createDefaultRobots().catch(err => console.error('初始化机器人数据时出错:', err));

module.exports = Robot;
