const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 对话模型
const chatSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  robotId: {
    type: String,
    enum: ['悉文', '悉荟', 'xiwen', 'xihui'],
    required: true
  },
  userMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  robotReply: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  tag: {
    type: String,
    default: ''
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
chatSchema.index({ userId: 1 });
chatSchema.index({ robotId: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ tag: 1 });

// 更新时间中间件
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
