const axios = require('axios');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');
const config = require('../config');

// 创建对话历史缓存实例，缓存时间为1小时
const historyCache = new NodeCache({ stdTTL: 3600 });

// 生成对话回复
exports.generateReply = async (messages, robotId) => {
  try {
    logger.info('生成对话回复 - 参数:', { messages, robotId });

    // 根据机器人类型设置不同的系统提示
    const systemPrompt = robotId === 'xiwen' 
      ? '你是一个男性化的AI助手，回答要简洁直接，使用"俺"、"问一下"等表达。'
      : '你是一个女性化的AI助手，回答要温柔体贴，使用"人家"、"亲"等表达。';

    // 构建请求数据
    const requestData = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    // 调用 OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', requestData, {
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data.choices[0].message.content;
    logger.info('生成对话回复成功:', { reply });

    return reply;
  } catch (error) {
    logger.error('生成对话回复失败:', error);
    
    // 如果 AI 服务调用失败，返回模拟回复
    const mockReplies = {
      xiwen: {
        '你好': '俺在呢，有啥事问一下？',
        '介绍一下你自己': '俺是悉文，一个直来直去的AI助手，有啥问题尽管问！',
        'default': '俺听着呢，继续说'
      },
      xihui: {
        '你好': '亲，人家在这儿呢~有什么可以帮你的吗？',
        '介绍一下你自己': '人家是悉荟呢，很高兴认识你哦亲~',
        'default': '人家听着呢，继续说吧亲~'
      }
    };

    const userMessage = messages[messages.length - 1].content;
    const replies = mockReplies[robotId];
    return replies[userMessage] || replies.default;
  }
};

// 获取对话历史
exports.getHistory = (sessionId) => {
  return historyCache.get(sessionId) || [];
};

// 保存对话历史
exports.saveHistory = (sessionId, messages) => {
  historyCache.set(sessionId, messages);
};

// 清除对话历史
exports.clearHistory = (sessionId) => {
  historyCache.del(sessionId);
};

// 管理对话上下文
exports.manageContext = (sessionId, newMessage) => {
  const history = exports.getHistory(sessionId);
  
  // 添加新消息
  history.push(newMessage);
  
  // 如果历史记录超过10条，删除最早的消息
  if (history.length > 10) {
    history.shift();
  }
  
  // 保存更新后的历史记录
  exports.saveHistory(sessionId, history);
  
  return history;
};

// 对话策略
exports.getDialogueStrategy = (robotId) => {
  const strategies = {
    xiwen: {
      maxContextLength: 10,
      temperature: 0.7,
      maxTokens: 1000,
      style: 'direct',
      personality: 'male'
    },
    xihui: {
      maxContextLength: 10,
      temperature: 0.8,
      maxTokens: 1000,
      style: 'gentle',
      personality: 'female'
    }
  };
  
  return strategies[robotId] || strategies.xiwen;
}; 