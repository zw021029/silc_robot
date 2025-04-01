// const BASE_URL = 'http://silcrobot.willzuo.top'  // 远程服务器的域名
const BASE_URL = 'http://localhost:3005'  // 开发环境本机测试

// 自定义参数序列化函数，替代URLSearchParams
function serializeParams(params) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

const request = (options) => {
  return new Promise((resolve, reject) => {
    // 处理GET请求的参数
    let url = options.url;
    let data = options.data;
    
    // 对于GET请求，将参数转换为URL查询字符串
    if (options.method === 'GET' && options.data) {
      // 如果options.data包含params字段，取出来单独处理
      if (options.data.params) {
        const queryString = serializeParams(options.data.params);
        if (url.includes('?')) {
          url += '&' + queryString;
        } else {
          url += '?' + queryString;
        }
        // 从data中移除params，避免重复
        data = { ...options.data };
        delete data.params;
      } else {
        // 直接将data作为URL参数
        const queryString = serializeParams(options.data);
        if (url.includes('?')) {
          url += '&' + queryString;
        } else {
          url += '?' + queryString;
        }
        // 清空data，因为已经放入URL中
        data = undefined;
      }
    }
    
    console.log('发起请求:', {
      url: `${BASE_URL}/api${url}`,
      method: options.method,
      data: data
    })

    // 获取token（如果有的话）
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: `${BASE_URL}/api${url}`,
      method: options.method || 'GET',
      data: data,
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
          const error = new Error(res.data?.message || res.data?.error || '请求失败')
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
module.exports = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data })
} 