const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 消息模型
const messageSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  robotId: {
    type: String,
    enum: ['xiwen', 'xihui'],
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['user', 'robot'],
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'voice'],
    default: 'text'
  },
  evaluated: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
messageSchema.index({ userId: 1 });
messageSchema.index({ robotId: 1 });
messageSchema.index({ chatId: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ createdAt: -1 });

// 更新时间中间件
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 