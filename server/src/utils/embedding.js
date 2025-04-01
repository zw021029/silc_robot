const logger = require('./logger');

// 简单的文本向量化函数（本地实现，不依赖OpenAI API）
async function getEmbedding(text) {
  try {
    if (!text || typeof text !== 'string') {
      logger.error('获取文本向量失败: 输入无效', { text });
      return null;
    }

    // 将文本转换为小写
    text = text.toLowerCase();
    
    // 对于中文文本，按字符分词
    const words = Array.from(text);
    
    // 创建词频向量
    const vector = new Map();
    words.forEach(word => {
      vector.set(word, (vector.get(word) || 0) + 1);
    });

    logger.info('文本向量化成功', { 
      text,
      vectorSize: vector.size
    });

    return vector;
  } catch (error) {
    logger.error('获取文本向量失败:', error);
    return null;
  }
}

// 计算两个向量的余弦相似度
function calculateSimilarity(vector1, vector2) {
  try {
    if (!vector1 || !vector2) {
      logger.warn('向量为空，返回相似度为0');
      return 0;
    }

    // 检查向量类型并转换为合适的格式
    const v1 = vector1 instanceof Map ? vector1 : convertToMap(vector1);
    const v2 = vector2 instanceof Map ? vector2 : convertToMap(vector2);
    
    if (!v1 || !v2) {
      logger.warn('向量格式无效，返回相似度为0');
      return 0;
    }

    // 获取所有唯一的词
    const allWords = new Set([...Array.from(v1.keys()), ...Array.from(v2.keys())]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allWords.forEach(word => {
      const val1 = v1.get(word) || 0;
      const val2 = v2.get(word) || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    // 避免除以零
    if (norm1 === 0 || norm2 === 0) {
      logger.warn('向量范数为0，返回相似度为0');
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity;
  } catch (error) {
    logger.error('计算向量相似度失败:', error);
    return 0;
  }
}

// 将普通对象转换为 Map 对象
function convertToMap(obj) {
  try {
    if (obj instanceof Map) {
      return obj;
    }
    
    const map = new Map();
    
    // 检查是否是普通对象
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        if (!isNaN(value)) { // 确保值是数字
          map.set(key, Number(value));
        }
      });
      return map;
    }
    
    logger.warn('无法转换为向量格式:', obj);
    return null;
  } catch (error) {
    logger.error('转换向量格式失败:', error);
    return null;
  }
}

module.exports = {
  getEmbedding,
  calculateSimilarity
}; 