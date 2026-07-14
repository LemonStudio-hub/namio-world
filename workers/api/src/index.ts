/**
 * Namio API Worker
 * Hono 后端：认证、域名管理、邮件管理、邮箱设置
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRoutes } from './routes/auth';
import { domainRoutes } from './routes/domains';
import { mailRoutes } from './routes/mails';
import { settingsRoutes } from './routes/settings';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const app = new Hono<{ Bindings: Env }>();

// ---- 全局中间件 ----

// CORS
app.use('/api/*', async (c, next) => {
  const origins = c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const corsMiddleware = cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// ---- 公开路由（无需认证） ----
app.route('/api/auth', authRoutes);

// ---- JWT 认证中间件（保护以下路由） ----
app.use('/api/domains/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/mails/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/settings/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

// ---- 受保护路由 ----
app.route('/api/domains', domainRoutes);
app.route('/api/mails', mailRoutes);
app.route('/api/settings', settingsRoutes);

// ---- 错误处理 ----
app.onError((err, c) => {
  console.error('[API Error]', err);
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
    500,
  );
});

// ---- 404 兜底 ----
app.notFound((c) => {
  return c.json(
    { success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } },
    404,
  );
});

export default app;
