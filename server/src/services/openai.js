const { Configuration, OpenAIApi } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const fs = require('fs');

// 配置 OpenAI
const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

/**
 * 处理文本并生成问答对
 * @param {string} text - 输入的文本内容
 * @returns {Promise<Array<{question: string, answer: string}>>} 问答对数组
 */
async function processTextToQA(text) {
  try {
    // 将文本分段
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    const qaPairs = [];

    // 对每个段落生成问答对
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      const prompt = `请基于以下文本生成一个问答对。问题应该简洁明了，答案应该准确完整。

文本：
${paragraph}

请按照以下格式输出：
Q: [问题]
A: [答案]`;

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const result = response.data.choices[0].text.trim();
      
      // 解析问答对
      const [questionMatch, answerMatch] = result.match(/Q: (.*?)\nA: (.*?)$/s)?.slice(1) || [];
      
      if (questionMatch && answerMatch) {
        qaPairs.push({
          question: questionMatch.trim(),
          answer: answerMatch.trim()
        });
      }
    }

    return qaPairs;
  } catch (error) {
    logger.error('处理文本生成问答对失败:', error);
    throw new Error('处理文本生成问答对失败');
  }
}

module.exports = {
  processTextToQA
}; 