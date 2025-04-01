const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const robotSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    enum: ['xiwen', 'xihui']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引以提高查询速度
robotSchema.index({ id: 1 });
robotSchema.index({ status: 1 });

// 更新时间的中间件
robotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Robot', robotSchema);
