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
import { validateSubdomain } from '../utils/validator';
import { hashPassword, verifyPassword } from '../utils/password';
import { success, fail } from '../utils/response';
import { userQueries } from '../utils/db';
import { rateLimitConfigs } from '../middleware/rateLimit';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
authRoutes.post('/register', rateLimitConfigs.register, async (c) => {
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { username, password } = body;

  // 输入验证
  if (!username || !password) {
    return fail(c, 'INVALID_INPUT', '用户名和密码均为必填', 400);
  }

  // 校验子域名
  const subdomainCheck = validateSubdomain(username.toLowerCase());
  if (!subdomainCheck.valid) {
    return fail(c, 'INVALID_INPUT', subdomainCheck.error!, 400);
  }

  // 密码强度校验
  if (password.length < 8 || password.length > 128) {
    return fail(c, 'INVALID_INPUT', '密码长度须为 8-128 个字符', 400);
  }

  // 检查用户名是否已存在
  const existing = await userQueries.findByUsername(c.env.DB, username.toLowerCase());
  if (existing) {
    return fail(c, 'USERNAME_TAKEN', '该用户名已被注册', 409);
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);
  const verifyToken = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

  // 插入用户
  await userQueries.create(c.env.DB, {
    username: username.toLowerCase(),
    passwordHash,
  });

  // 签发 JWT（有效期 24 小时）
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: username.toLowerCase(), iat: now, exp: now + 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  return success(c, {
    token,
    user: {
      username: username.toLowerCase(),
      hasDomain: false,
      hasEmail: false,
    },
  }, 201);
});

// POST /api/auth/login
authRoutes.post('/login', rateLimitConfigs.login, async (c) => {
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

  // 查找用户
  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, status FROM users WHERE username = ?'
  )
    .bind(username.toLowerCase())
    .first<{ id: number; username: string; password_hash: string; status: string }>();

  // 用户不存在或已删除
  if (!user || user.status === 'deleted') {
    return fail(c, 'UNAUTHORIZED', '用户名或密码错误', 401);
  }

  // 验证密码
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return fail(c, 'UNAUTHORIZED', '用户名或密码错误', 401);
  }

  // 更新最后登录时间（不自动解冻账号）
  await userQueries.updateLastLogin(c.env.DB, user.id);

  // 签发 JWT（有效期 24 小时）
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: user.username, iat: now, exp: now + 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  // 获取用户完整信息
  const fullUser = await c.env.DB.prepare(
    'SELECT has_domain, has_email FROM users WHERE id = ?'
  )
    .bind(user.id)
    .first<{ has_domain: number; has_email: number }>();

  return success(c, {
    token,
    user: {
      username: user.username,
      hasDomain: fullUser?.has_domain === 1,
      hasEmail: fullUser?.has_email === 1,
    },
  });
});

// POST /api/auth/logout
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
            status, verify_status, has_domain, has_email,
            created_at, last_login_at, total_mail_size
     FROM users WHERE username = ?`
  )
    .bind(payload.sub)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, user);
});

// PUT /api/auth/password — 修改密码（需 JWT）
authRoutes.put('/password', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return jwtMiddleware(c, next);
}, async (c) => {
  const payload = c.get('jwtPayload') as { sub: string };

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return fail(c, 'INVALID_INPUT', '当前密码和新密码均为必填', 400);
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    return fail(c, 'INVALID_INPUT', '新密码长度须为 8-128 个字符', 400);
  }

  // 查找用户
  const user = await c.env.DB.prepare(
    'SELECT id, password_hash FROM users WHERE username = ?'
  )
    .bind(payload.sub)
    .first<{ id: number; password_hash: string }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 验证当前密码
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return fail(c, 'UNAUTHORIZED', '当前密码错误', 401);
  }

  // 哈希新密码
  const newPasswordHash = await hashPassword(newPassword);

  // 更新密码
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
    .bind(newPasswordHash, user.id)
    .run();

  return success(c, { message: '密码修改成功' });
});

// DELETE /api/auth/account — 删除账号（需 JWT）
authRoutes.delete('/account', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return jwtMiddleware(c, next);
}, async (c) => {
  const payload = c.get('jwtPayload') as { sub: string };

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { password } = body;

  if (!password) {
    return fail(c, 'INVALID_INPUT', '密码为必填', 400);
  }

  // 查找用户
  const user = await c.env.DB.prepare(
    'SELECT id, password_hash FROM users WHERE username = ?'
  )
    .bind(payload.sub)
    .first<{ id: number; password_hash: string }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 验证密码
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return fail(c, 'UNAUTHORIZED', '密码错误', 401);
  }

  // 软删除用户（级联删除会自动删除邮件）
  await c.env.DB.prepare(
    "UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(user.id)
    .run();

  return success(c, { message: '账号已删除' });
});
