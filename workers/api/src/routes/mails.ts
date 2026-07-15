/**
 * 邮件管理路由（需 JWT 认证）
 * GET    /mails           获取邮件列表（分页）
 * GET    /mails/stats     获取邮件统计
 * GET    /mails/:id       获取单封邮件详情
 * PUT    /mails/:id/read  标记已读
 * PUT    /mails/:id/unread 标记未读
 * PUT    /mails/:id/star  切换星标
 * DELETE /mails/:id       删除单封邮件
 * DELETE /mails           批量删除邮件
 * PUT    /mails/read      批量标记已读
 * PUT    /mails/unread    批量标记未读
 * POST   /mails/register  注册邮箱
 */

import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { getUsername } from '../middleware/auth';
import { parsePagination, parseId, parseSort } from '../middleware/validate';
import { userQueries, mailQueries } from '../utils/db';
import { getCache, cacheKeys, cacheTtl } from '../utils/cache';
import type { Env } from '../index';

export const mailRoutes = new Hono<{ Bindings: Env }>();

// GET /api/mails?page=1&limit=20&status=all&search=xxx
mailRoutes.get('/', async (c) => {
  const username = getUsername(c);

  // 获取用户
  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 检查是否已注册邮箱
  if (!user.has_email) {
    return fail(c, 'BAD_REQUEST', '尚未注册邮箱', 400);
  }

  // 解析参数
  const { page, limit, offset } = parsePagination(c);
  const status = c.req.query('status') || 'all';
  const search = c.req.query('search') || '';
  const { field: sortBy, order: sortOrder } = parseSort(
    c,
    ['received_at', 'size', 'from_address', 'subject'],
    'received_at',
    'desc'
  );

  // 查询邮件列表
  const result = await mailQueries.getList(c.env.DB, user.id, {
    page,
    limit,
    offset,
    status,
    search,
    sortBy,
    sortOrder,
  });

  return success(c, result);
});

// GET /api/mails/stats
mailRoutes.get('/stats', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 尝试从缓存获取
  const cache = getCache(c.env);
  if (cache) {
    const cached = await cache.get(cacheKeys.mailStats(user.id));
    if (cached) {
      return success(c, cached);
    }
  }

  const stats = await mailQueries.getStats(c.env.DB, user.id);

  const result = {
    total: stats?.total ?? 0,
    unread: stats?.unread ?? 0,
    starred: stats?.starred ?? 0,
    total_size: stats?.total_size ?? 0,
  };

  // 缓存结果
  if (cache) {
    await cache.set(cacheKeys.mailStats(user.id), result, { ttl: cacheTtl.mailStats });
  }

  return success(c, result);
});

// GET /api/mails/:id
mailRoutes.get('/:id', async (c) => {
  const username = getUsername(c);
  const mailId = parseId(c);

  if (!mailId) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 获取邮件详情
  const mail = await mailQueries.getDetail(c.env.DB, mailId, user.id);
  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  // 标记为已读
  if (!mail.is_read) {
    await mailQueries.markRead(c.env.DB, mailId);
  }

  return success(c, mail);
});

// DELETE /api/mails/:id
mailRoutes.delete('/:id', async (c) => {
  const username = getUsername(c);
  const mailId = parseId(c);

  if (!mailId) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 删除邮件并获取大小
  const deletedSize = await mailQueries.deleteWithSize(c.env.DB, mailId, user.id);
  if (deletedSize === 0) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  // 清除缓存
  const cache = getCache(c.env);
  if (cache) {
    await cache.delete(cacheKeys.mailStats(user.id));
  }

  return success(c, { message: '邮件已删除' });
});

// DELETE /api/mails  批量删除
mailRoutes.delete('/', async (c) => {
  const username = getUsername(c);

  let body: { ids?: number[] };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return fail(c, 'INVALID_INPUT', '请提供要删除的邮件 ID 列表', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 批量删除
  const deletedCount = await mailQueries.batchDelete(c.env.DB, user.id, body.ids);

  // 清除缓存
  const cache = getCache(c.env);
  if (cache) {
    await cache.delete(cacheKeys.mailStats(user.id));
  }

  return success(c, { deleted: deletedCount });
});

// PUT /api/mails/:id/read
mailRoutes.put('/:id/read', async (c) => {
  const username = getUsername(c);
  const mailId = parseId(c);

  if (!mailId) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const mail = await mailQueries.getDetail(c.env.DB, mailId, user.id);
  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  await mailQueries.markRead(c.env.DB, mailId);

  return success(c, { message: '已标记为已读' });
});

// PUT /api/mails/:id/unread
mailRoutes.put('/:id/unread', async (c) => {
  const username = getUsername(c);
  const mailId = parseId(c);

  if (!mailId) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const mail = await mailQueries.getDetail(c.env.DB, mailId, user.id);
  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  await mailQueries.markUnread(c.env.DB, mailId);

  return success(c, { message: '已标记为未读' });
});

// PUT /api/mails/:id/star
mailRoutes.put('/:id/star', async (c) => {
  const username = getUsername(c);
  const mailId = parseId(c);

  if (!mailId) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const mail = await mailQueries.getDetail(c.env.DB, mailId, user.id);
  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  const isStarred = await mailQueries.toggleStar(c.env.DB, mailId);

  return success(c, { is_starred: isStarred });
});

// PUT /api/mails/read  批量标记已读
mailRoutes.put('/read', async (c) => {
  const username = getUsername(c);

  let body: { ids?: number[] };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return fail(c, 'INVALID_INPUT', '请提供邮件 ID 列表', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  await mailQueries.batchUpdateStatus(c.env.DB, user.id, body.ids, 'is_read', 1);

  return success(c, { message: '已批量标记为已读' });
});

// PUT /api/mails/unread  批量标记未读
mailRoutes.put('/unread', async (c) => {
  const username = getUsername(c);

  let body: { ids?: number[] };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return fail(c, 'INVALID_INPUT', '请提供邮件 ID 列表', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  await mailQueries.batchUpdateStatus(c.env.DB, user.id, body.ids, 'is_read', 0);

  return success(c, { message: '已批量标记为未读' });
});

// POST /api/mails/register  注册邮箱
mailRoutes.post('/register', async (c) => {
  const username = getUsername(c);

  let body: { forwardEmail?: string | null };
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  if (user.has_email) {
    return fail(c, 'CONFLICT', '邮箱已注册', 409);
  }

  // 验证转发邮箱格式
  if (body.forwardEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.forwardEmail)) {
      return fail(c, 'INVALID_INPUT', '转发邮箱格式无效', 400);
    }
  }

  await userQueries.update(c.env.DB, user.id, {
    has_email: 1,
    forward_email: body.forwardEmail || null,
    email_enabled: 1,
  });

  return success(c, {
    email: `${username}@nomio.world`,
    forwardEmail: body.forwardEmail || null,
    emailEnabled: true,
  }, 201);
});
