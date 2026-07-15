/**
 * Nomio API Worker
 * Hono 后端：认证、域名管理、邮件管理、邮箱设置、WAF规则
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRoutes } from './routes/auth';
import { domainRoutes } from './routes/domains';
import { mailRoutes } from './routes/mails';
import { settingsRoutes } from './routes/settings';
import { wafRoutes } from './routes/waf';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_KV?: KVNamespace;
  CACHE_KV?: KVNamespace;
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
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// 安全头
app.use('/api/*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// 请求日志
app.use('/api/*', async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[${method}] ${path} ${status} ${duration}ms`);
});

// ---- 公开路由（无需认证） ----
app.route('/api/auth', authRoutes);

// ---- JWT 认证中间件（保护以下路由） ----
app.use('/api/domains/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/domains', async (c, next) => {
  // 允许 POST /api/domains/register 和 GET /api/domains
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/mails/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/mails', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/settings/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/waf/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/waf', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

// ---- 受保护路由 ----
app.route('/api/domains', domainRoutes);
app.route('/api/mails', mailRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/waf', wafRoutes);

// ---- 健康检查 ----
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ---- 错误处理 ----
app.onError((err, c) => {
  console.error('[API Error]', err);

  // 生产环境不暴露错误详情
  const isProduction = c.env.ALLOWED_ORIGINS !== '*';

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction ? '服务器内部错误' : err.message,
      },
    },
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
