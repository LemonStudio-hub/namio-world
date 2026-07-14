/**
 * 域名管理路由（需 JWT 认证）
 * GET    /domains          获取域名配置
 * PUT    /domains          更新源站地址
 * DELETE /domains          删除域名（释放用户名）
 * POST   /domains/verify   触发源站验证
 */

import { Hono } from 'hono';
import { validateOriginUrl } from '../utils/validator';
import { success, fail } from '../utils/response';
import type { Env } from '../index';

export const domainRoutes = new Hono<{ Bindings: Env }>();

// 从 JWT payload 获取用户名
function getUsername(c: any): string {
  const payload = c.get('jwtPayload') as { sub: string };
  return payload.sub;
}

// GET /api/domains
domainRoutes.get('/', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT username, origin_url, origin_host, verify_status, created_at FROM users WHERE username = ?',
  )
    .bind(username)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, user);
});

// PUT /api/domains
domainRoutes.put('/', async (c) => {
  const username = getUsername(c);

  let body: { originUrl?: string; originHost?: string };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const { originUrl, originHost } = body;
  if (!originUrl) {
    return fail(c, 'INVALID_INPUT', '源站地址为必填', 400);
  }

  const originCheck = validateOriginUrl(originUrl);
  if (!originCheck.valid) {
    return fail(c, 'INVALID_INPUT', originCheck.error!, 400);
  }

  const hostname = new URL(originUrl).hostname;
  const host = originHost || hostname;

  await c.env.DB.prepare(
    'UPDATE users SET origin_url = ?, origin_host = ?, verify_status = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
  )
    .bind(originUrl, host, 'pending', username)
    .run();

  return success(c, { originUrl, originHost: host, verifyStatus: 'pending' });
});

// DELETE /api/domains
domainRoutes.delete('/', async (c) => {
  const username = getUsername(c);

  // 软删除：标记为 deleted，级联删除邮件由外键处理
  await c.env.DB.prepare(
    'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
  )
    .bind('deleted', username)
    .run();

  return success(c, { message: '域名已删除' });
});

// POST /api/domains/verify
domainRoutes.post('/verify', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT id, origin_url, verify_token FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number; origin_url: string; verify_token: string }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 发起验证请求
  const verifyUrl = `${user.origin_url.replace(/\/$/, '')}/.well-known/namio-verify.txt`;

  try {
    const resp = await fetch(verifyUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      await c.env.DB.prepare(
        'UPDATE users SET verify_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      )
        .bind('failed', user.id)
        .run();
      return fail(c, 'VERIFY_FAILED', `验证文件不可访问（HTTP ${resp.status}）`, 400);
    }

    const content = await resp.text();
    const expected = `namio-verify=${user.verify_token}`;

    if (content.trim() === expected) {
      await c.env.DB.prepare(
        'UPDATE users SET verify_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      )
        .bind('verified', user.id)
        .run();
      return success(c, { verifyStatus: 'verified' });
    } else {
      await c.env.DB.prepare(
        'UPDATE users SET verify_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      )
        .bind('failed', user.id)
        .run();
      return fail(c, 'VERIFY_FAILED', '验证文件内容不匹配', 400);
    }
  } catch (err) {
    await c.env.DB.prepare(
      'UPDATE users SET verify_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .bind('failed', user.id)
      .run();
    return fail(c, 'VERIFY_FAILED', '无法连接到源站', 400);
  }
});
