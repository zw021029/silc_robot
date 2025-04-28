const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointsTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend', 'admin', 'refund', 'expire'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  sourceType: {
    type: String,
    enum: ['chat', 'login', 'share', 'admin', 'system', 'other', 'feedback'],
    required: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    refPath: 'sourceModel'
  },
  sourceModel: {
    type: String,
    enum: ['ChatMessage', 'User', 'Reward', null, 'Feedback']
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引以提高查询速度
pointsTransactionSchema.index({ userId: 1, createdAt: -1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ sourceType: 1, sourceId: 1 });

module.exports = mongoose.model('PointsTransaction', pointsTransactionSchema);
