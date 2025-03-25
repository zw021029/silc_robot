// const BASE_URL = 'http://silcrobot.willzuo.top'  // 远程服务器的域名
const BASE_URL = 'http://localhost:3000'  // 开发环境本机测试

const request = (options) => {
  return new Promise((resolve, reject) => {
    console.log('发起请求:', {
      url: `${BASE_URL}${options.url}`,
      method: options.method,
      data: options.data
    })

    // 获取token（如果有的话）
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        console.log('请求成功，响应数据:', res)
        
        if (res.statusCode === 401) {
          // token失效，清除token并跳转到登录页
          wx.removeStorageSync('token')
          wx.reLaunch({
            url: '/pages/login/login'
          })
          reject(new Error('未登录或登录已过期'))
          return
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const error = new Error(res.data?.message || '请求失败')
          error.statusCode = res.statusCode
          error.response = res.data
          reject(error)
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        // 添加更详细的错误信息
        const errorMsg = err.errMsg || '网络请求失败'
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        reject(new Error(errorMsg))
      }
    })
  })
}

// 导出请求方法
const http = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data })
}

export default http 