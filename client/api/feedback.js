import request from '../utils/request'

// 提交反馈 
export const postFeedback = (data) => {
    return request.post('/api/feedback/submit', data)
}

// 获取反馈列表（管理员用）
export const getFeedbackList = () => {
    return request.get('/api/feedback/list')
}