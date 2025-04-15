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
    
    // 如果向量中没有任何词，返回0
    if (allWords.size === 0) {
      logger.warn('向量中没有任何词，返回相似度为0');
      return 0;
    }

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
    
    logger.debug('计算相似度详情', {
      dotProduct,
      norm1,
      norm2,
      similarity,
      v1Size: v1.size,
      v2Size: v2.size,
      v1Type: typeof v1,
      v2Type: typeof v2,
      v1Keys: Array.from(v1.keys()).slice(0, 5),
      v2Keys: Array.from(v2.keys()).slice(0, 5)
    });
    
    return similarity;
  } catch (error) {
    logger.error('计算向量相似度失败:', error, {
      vector1Type: typeof vector1,
      vector2Type: typeof vector2,
      vector1IsMap: vector1 instanceof Map,
      vector2IsMap: vector2 instanceof Map
    });
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
      // 尝试不同的格式
      // 格式1: 标准对象 {key: value}
      if (Object.keys(obj).length > 0) {
        Object.entries(obj).forEach(([key, value]) => {
          if (!isNaN(value)) { // 确保值是数字
            map.set(key, Number(value));
          }
        });
      }
      // 格式2: MongoDB存储的格式可能是 {_doc: {map: {entries: [[key, value]]}}}
      else if (obj._doc && obj._doc.map && Array.isArray(obj._doc.map.entries)) {
        obj._doc.map.entries.forEach(([key, value]) => {
          if (!isNaN(value)) {
            map.set(key, Number(value));
          }
        });
      }
      // 尝试其他可能的格式
      else if (obj.map && typeof obj.map === 'object') {
        Object.entries(obj.map).forEach(([key, value]) => {
          if (!isNaN(value)) {
            map.set(key, Number(value));
          }
        });
      }
    }
    
    if (map.size === 0) {
      logger.warn('无法转换为向量格式，结果为空Map:', {
        objType: typeof obj,
        objKeys: obj ? Object.keys(obj) : [],
        objIsArray: Array.isArray(obj)
      });
    }
    
    return map;
  } catch (error) {
    logger.error('转换向量格式失败:', error, {
      objType: typeof obj,
      obj: JSON.stringify(obj).substring(0, 100) + '...'
    });
    return new Map(); // 返回空Map而不是null，避免后续处理出错
  }
}

module.exports = {
  getEmbedding,
  calculateSimilarity
}; 