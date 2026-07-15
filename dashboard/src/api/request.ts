/**
 * API 请求封装
 * 基于 ofetch，自动携带 JWT Token
 */

import { ofetch } from 'ofetch';

// API 基础地址
const API_BASE = import.meta.env.VITE_API_BASE || 'https://nomio-api.lemonhub.workers.dev/api';

const request = ofetch.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  onRequest({ options }) {
    // 从 localStorage 读取 Token
    const token = localStorage.getItem('nomio_token');
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
      localStorage.removeItem('nomio_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  },
});

export default request;
