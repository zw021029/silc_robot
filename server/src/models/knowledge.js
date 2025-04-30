const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 知识库文章模型
const knowledgeArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  robotName: {
    type: String,
    enum: ['悉文', '悉荟', 'all'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  source: {
    type: String
  },
  author: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  embeddings: {
    type: Boolean,
    default: false
  },
  vector: {
    type: Schema.Types.Mixed,
    default: () => new Map()
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true,
  collection: 'knowledgearticles'
});

// 知识库分类模型
const knowledgeCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeCategory'
  },
  order: {
    type: Number,
    default: 0
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
knowledgeArticleSchema.index({ title: 'text', content: 'text' });
knowledgeArticleSchema.index({ robotName: 1 });
knowledgeArticleSchema.index({ category: 1 });
knowledgeArticleSchema.index({ tags: 1 });
knowledgeArticleSchema.index({ status: 1 });
knowledgeArticleSchema.index({ createdAt: -1 });

knowledgeCategorySchema.index({ name: 1 });
knowledgeCategorySchema.index({ parentId: 1 });

// 更新时间的中间件
knowledgeArticleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

knowledgeCategorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
const KnowledgeCategory = mongoose.model('KnowledgeCategory', knowledgeCategorySchema);

// 为了向后兼容，Knowledge模型也指向相同的集合
const Knowledge = mongoose.model('Knowledge', knowledgeArticleSchema, 'knowledgearticles');

module.exports = {
  KnowledgeArticle,
  KnowledgeCategory,
  Knowledge
};
