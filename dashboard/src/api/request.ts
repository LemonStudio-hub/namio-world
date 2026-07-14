/**
 * API 请求封装
 * 基于 ofetch，自动携带 JWT Token
 */

import { ofetch } from 'ofetch';

const request = ofetch.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  onRequest({ options }) {
    // 从 localStorage 读取 Token
    const token = localStorage.getItem('namio_token');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  },
  onResponseError({ response }) {
    // 401 → 清除 Token，跳转登录
    if (response.status === 401) {
      localStorage.removeItem('namio_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  },
});

export default request;
