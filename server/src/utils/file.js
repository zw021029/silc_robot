const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const logger = require('./logger');

// 解析CSV文件
exports.parseCSV = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    return records;
  } catch (error) {
    logger.error('解析CSV文件失败:', error);
    throw error;
  }
};

// 解析Excel文件
exports.parseExcel = async (filePath) => {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json(worksheet);
    
    return records;
  } catch (error) {
    logger.error('解析Excel文件失败:', error);
    throw error;
  }
};

// 解析PDF文件
exports.parsePDF = async (filePath) => {
  try {
    const pdf = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // 将PDF文本转换为问答对格式
    const records = convertPDFToQA(data.text);
    return records;
  } catch (error) {
    logger.error('解析PDF文件失败:', error);
    throw error;
  }
};

// 将PDF文本转换为问答对
function convertPDFToQA(text) {
  const records = [];
  const paragraphs = text.split('\n\n');
  
  for (let i = 0; i < paragraphs.length; i += 2) {
    if (paragraphs[i] && paragraphs[i + 1]) {
      records.push({
        question: paragraphs[i].trim(),
        answer: paragraphs[i + 1].trim()
      });
    }
  }
  
  return records;
}

// 导出CSV文件
exports.exportCSV = (data, filePath) => {
  try {
    const csvContent = stringify(data, {
      header: true,
      columns: ['question', 'answer', 'robotId', 'category', 'keywords']
    });
    
    fs.writeFileSync(filePath, csvContent);
    return true;
  } catch (error) {
    logger.error('导出CSV文件失败:', error);
    throw error;
  }
};

// 导出Excel文件
exports.exportExcel = (data, filePath) => {
  try {
    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '知识库');
    XLSX.writeFile(workbook, filePath);
    return true;
  } catch (error) {
    logger.error('导出Excel文件失败:', error);
    throw error;
  }
};

// 获取文件扩展名
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// 验证文件类型
exports.validateFileType = (filePath, allowedTypes) => {
  const ext = exports.getFileExtension(filePath);
  return allowedTypes.includes(ext);
}; 