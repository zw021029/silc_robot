import request from '../utils/request'

// 提交反馈 
export const postFeedback = (data) => {
    // 转换反馈类型为数据库支持的值
    const typeMap = {
        '功能建议': 'feature',
        '问题反馈': 'bug',
        '其他': 'other'
    };
    
    const transformedData = {
        ...data,
        type: typeMap[data.type] || 'other'
    };
    
    return request.post('/api/feedback/submit', transformedData)
}

// 获取反馈列表（管理员用）
export const getFeedbackList = () => {
    return request.get('/api/feedback/list')
}