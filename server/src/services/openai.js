const OpenAI = require('openai'); // 1. 修改导入方式
const config = require('../config');
const logger = require('../utils/logger');
const fs = require('fs'); // fs 模块在此代码片段中未被使用，如果其他地方也不用可以考虑移除

// 2. 修改 OpenAI 客户端初始化方式
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

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

      // 3. 更新 API 调用方法和建议的模型
      const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct", // 建议使用更新的 instruct 模型替代 text-davinci-003
                                      // 如果你仍想用 text-davinci-003，并且你的 API key 支持，可以改回
                                      // 但 text-davinci-003 属于旧版模型
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // 4. 调整获取结果的方式 (移除了 .data)
      const result = response.choices[0].text.trim();
      
      // 解析问答对
      // 正则表达式尝试匹配以 "Q: " 开头，后跟任意字符（非贪婪）直到换行符，
      // 然后是 "A: "，后跟任意字符直到字符串末尾。
      // 使用 s (dotall) 标志使 . 可以匹配换行符。
      const match = result.match(/Q:\s*(.*?)\s*A:\s*(.*)/s);
      
      if (match && match[1] && match[2]) {
        qaPairs.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      } else {
        // 如果解析失败，可以记录一下原始结果，方便调试
        logger.warn(`无法从以下结果中解析问答对: "${result}"`);
      }
    }

    return qaPairs;
  } catch (error) {
    // 记录更详细的错误信息，特别是来自 OpenAI API 的错误
    if (error.response) {
      logger.error('OpenAI API 错误:', error.response.data);
    } else {
      logger.error('处理文本生成问答对失败:', error.message);
    }
    throw new Error('处理文本生成问答对失败');
  }
}

module.exports = {
  processTextToQA
};