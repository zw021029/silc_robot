import axios from 'axios';
import config from '../config';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === 0) {
      return res.data;
    } else {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  error => {
    console.error('请求失败:', error);
    ElMessage.error(error.message || '请求失败');
    return Promise.reject(error);
  }
);

export default request; 