/**
 * 域名管理路由（需 JWT 认证）
 * GET    /domains              获取域名配置
 * POST   /domains/register     注册域名
 * PUT    /domains              更新源站地址
 * DELETE /domains              删除域名（释放用户名）
 * POST   /domains/verify       触发源站验证
 */

import { Hono } from 'hono';
import { validateOriginUrl } from '../utils/validator';
import { success, fail } from '../utils/response';
import { getUsername } from '../middleware/auth';
import { userQueries } from '../utils/db';
import { getCache, cacheKeys, cacheTtl } from '../utils/cache';
import type { Env } from '../index';

export const domainRoutes = new Hono<{ Bindings: Env }>();

// GET /api/domains
domainRoutes.get('/', async (c) => {
  const username = getUsername(c);
  const cache = getCache(c.env);

  // 尝试从缓存获取
  if (cache) {
    const cached = await cache.get(cacheKeys.domain(username));
    if (cached) {
      return success(c, cached);
    }
  }

  const user = await c.env.DB.prepare(
    'SELECT username, origin_url, origin_host, verify_status, has_domain, created_at FROM users WHERE username = ?'
  )
    .bind(username)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 缓存结果
  if (cache && user.has_domain) {
    await cache.set(cacheKeys.domain(username), user, { ttl: cacheTtl.domain });
  }

  return success(c, user);
});

// POST /api/domains/register
domainRoutes.post('/register', async (c) => {
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

  // 获取用户信息
  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 检查是否已注册域名
  if (user.has_domain) {
    return fail(c, 'CONFLICT', '域名已注册', 409);
  }

  const hostname = new URL(originUrl).hostname;
  const host = originHost || hostname;
  const verifyToken = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

  // 更新用户域名信息
  await userQueries.update(c.env.DB, user.id, {
    origin_url: originUrl,
    origin_host: host,
    has_domain: 1,
    verify_token: verifyToken,
    verify_status: 'pending',
  });

  // 清除缓存
  const cache = getCache(c.env);
  if (cache) {
    await cache.delete(cacheKeys.domain(username));
  }

  return success(c, {
    originUrl,
    originHost: host,
    verifyToken,
    verifyStatus: 'pending',
  }, 201);
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

  // 获取用户信息
  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  if (!user.has_domain) {
    return fail(c, 'BAD_REQUEST', '尚未注册域名', 400);
  }

  // 发起验证请求
  const verifyUrl = `${user.origin_url.replace(/\/$/, '')}/.well-known/nomio-verify.txt`;

  try {
    const resp = await fetch(verifyUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Nomio-Verify/1.0',
      },
    });

    if (!resp.ok) {
      await userQueries.update(c.env.DB, user.id, { verify_status: 'failed' });
      return fail(c, 'VERIFY_FAILED', `验证文件不可访问（HTTP ${resp.status}）`, 400);
    }

    const content = await resp.text();
    const expected = `nomio-verify=${user.verify_token}`;

    if (content.trim() === expected) {
      await userQueries.update(c.env.DB, user.id, { verify_status: 'verified' });

      // 清除缓存
      const cache = getCache(c.env);
      if (cache) {
        await cache.delete(cacheKeys.domain(username));
      }

      return success(c, { verifyStatus: 'verified' });
    } else {
      await userQueries.update(c.env.DB, user.id, { verify_status: 'failed' });
      return fail(c, 'VERIFY_FAILED', '验证文件内容不匹配', 400);
    }
  } catch (err) {
    await userQueries.update(c.env.DB, user.id, { verify_status: 'failed' });
    return fail(c, 'VERIFY_FAILED', '无法连接到源站', 400);
  }
});
