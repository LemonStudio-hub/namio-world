/**
 * Namio Gateway Worker
 * Hono 反向代理网关：将子域名请求转发到用户源站
 */

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// 通配路由：处理所有子域名请求
app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname;
  const subdomain = hostname.split('.')[0];

  // 1. 基本格式校验
  if (!subdomain || subdomain.length > 63) {
    return c.text('无效的域名', 400);
  }

  // 2. 从 D1 查询用户配置
  const user = await c.env.DB.prepare(
    'SELECT origin_url, origin_host FROM users WHERE username = ? AND status = ?',
  )
    .bind(subdomain, 'active')
    .first<{ origin_url: string; origin_host: string }>();

  if (!user) {
    return c.text('域名未注册或已停用', 404);
  }

  // 3. 强制 HTTPS 回源校验
  if (!user.origin_url.startsWith('https://')) {
    return c.text('源站配置错误：必须使用 HTTPS', 502);
  }

  // 4. 构造回源请求
  const originUrl = new URL(user.origin_url);
  const targetUrl = `${originUrl.origin}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set('Host', user.origin_host || originUrl.hostname);
  headers.set('X-Forwarded-For', c.req.header('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Real-IP', c.req.header('CF-Connecting-IP') || '');

  // 5. 发起回源请求（AbortController 控制超时）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    // 6. 透传响应，注入安全头
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return c.text('源站响应超时', 504);
    }
    return c.text('源站连接失败', 502);
  }
});

export default app;
