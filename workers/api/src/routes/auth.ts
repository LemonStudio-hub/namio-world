/**
 * 认证路由
 * POST /register  用户注册
 * POST /login     用户登录
 * POST /logout    退出登录
 * GET  /me        获取当前用户信息
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { sign } from 'hono/jwt';
import { validateSubdomain, validateOriginUrl } from '../utils/validator';
import { hashPassword, verifyPassword } from '../utils/password';
import { success, fail } from '../utils/response';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  let body: { username?: string; password?: string; originUrl?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { username, password, originUrl } = body;
  if (!username || !password || !originUrl) {
    return fail(c, 'INVALID_INPUT', '用户名、密码和源站地址均为必填', 400);
  }

  // 校验子域名
  const subdomainCheck = validateSubdomain(username.toLowerCase());
  if (!subdomainCheck.valid) {
    return fail(c, 'INVALID_INPUT', subdomainCheck.error!, 400);
  }

  // 校验源站 URL
  const originCheck = validateOriginUrl(originUrl);
  if (!originCheck.valid) {
    return fail(c, 'INVALID_INPUT', originCheck.error!, 400);
  }

  // 密码长度校验
  if (password.length < 8 || password.length > 128) {
    return fail(c, 'INVALID_INPUT', '密码长度须为 8-128 个字符', 400);
  }

  // 检查用户名是否已存在
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username.toLowerCase())
    .first();

  if (existing) {
    return fail(c, 'USERNAME_TAKEN', '该用户名已被注册', 409);
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);
  const originHostname = new URL(originUrl).hostname;
  const verifyToken = crypto.randomUUID();

  // 插入用户
  await c.env.DB.prepare(
    `INSERT INTO users (username, password_hash, origin_url, origin_host, verify_token)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(username.toLowerCase(), passwordHash, originUrl, originHostname, verifyToken)
    .run();

  // 签发 JWT
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: username.toLowerCase(), iat: now, exp: now + 7 * 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  return success(c, {
    token,
    user: { username: username.toLowerCase(), originUrl, verifyToken },
  }, 201);
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { username, password } = body;
  if (!username || !password) {
    return fail(c, 'INVALID_INPUT', '用户名和密码均为必填', 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, status FROM users WHERE username = ?',
  )
    .bind(username.toLowerCase())
    .first<{ id: number; username: string; password_hash: string; status: string }>();

  if (!user || user.status === 'deleted') {
    return fail(c, 'UNAUTHORIZED', '用户名或密码错误', 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return fail(c, 'UNAUTHORIZED', '用户名或密码错误', 401);
  }

  // 更新最后登录时间，解冻账号
  await c.env.DB.prepare(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?',
  )
    .bind('active', user.id)
    .run();

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: user.username, iat: now, exp: now + 7 * 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  return success(c, { token, user: { username: user.username } });
});

// POST /api/auth/logout
// 前端清除 Token 即可，此接口仅作语义占位
authRoutes.post('/logout', async (c) => {
  return success(c, { message: '已退出登录' });
});

// GET /api/auth/me — 需要 JWT
authRoutes.get('/me', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return jwtMiddleware(c, next);
}, async (c) => {
  const payload = c.get('jwtPayload') as { sub: string };
  const user = await c.env.DB.prepare(
    `SELECT username, origin_url, origin_host, forward_email, email_enabled,
            status, verify_status, created_at, last_login_at, total_mail_size
     FROM users WHERE username = ?`,
  )
    .bind(payload.sub)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, user);
});
