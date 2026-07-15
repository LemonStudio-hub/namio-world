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
import type { Env } from '../index';

export const mailRoutes = new Hono<{ Bindings: Env }>();

function getUsername(c: any): string {
  const payload = c.get('jwtPayload') as { sub: string };
  return payload.sub;
}

// GET /api/mails?page=1&limit=20&unread=false
mailRoutes.get('/', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 分页参数
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;
  const unreadOnly = c.req.query('unread') === 'true';

  // 查询总数
  const countSql = unreadOnly
    ? 'SELECT COUNT(*) as total FROM mails WHERE user_id = ? AND is_read = 0'
    : 'SELECT COUNT(*) as total FROM mails WHERE user_id = ?';
  const countResult = await c.env.DB.prepare(countSql)
    .bind(user.id)
    .first<{ total: number }>();
  const total = countResult?.total ?? 0;

  // 查询列表（不返回 body，节省带宽）
  const listSql = unreadOnly
    ? 'SELECT id, from_address, subject, received_at, size, is_read FROM mails WHERE user_id = ? AND is_read = 0 ORDER BY received_at DESC LIMIT ? OFFSET ?'
    : 'SELECT id, from_address, subject, received_at, size, is_read FROM mails WHERE user_id = ? ORDER BY received_at DESC LIMIT ? OFFSET ?';
  const { results } = await c.env.DB.prepare(listSql)
    .bind(user.id, limit, offset)
    .all();

  return success(c, {
    mails: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/mails/:id
mailRoutes.get('/:id', async (c) => {
  const username = getUsername(c);
  const mailId = parseInt(c.req.param('id'), 10);

  if (isNaN(mailId)) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  // 验证邮件归属
  const mail = await c.env.DB.prepare(
    `SELECT m.* FROM mails m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = ? AND u.username = ?`,
  )
    .bind(mailId, username)
    .first();

  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  // 标记为已读
  await c.env.DB.prepare(
    'UPDATE mails SET is_read = 1 WHERE id = ?',
  )
    .bind(mailId)
    .run();

  return success(c, mail);
});

// DELETE /api/mails/:id
mailRoutes.delete('/:id', async (c) => {
  const username = getUsername(c);
  const mailId = parseInt(c.req.param('id'), 10);

  if (isNaN(mailId)) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  // 验证归属并获取大小
  const mail = await c.env.DB.prepare(
    `SELECT m.id, m.size FROM mails m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = ? AND u.username = ?`,
  )
    .bind(mailId, username)
    .first<{ id: number; size: number }>();

  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM mails WHERE id = ?').bind(mailId),
    c.env.DB.prepare(
      'UPDATE users SET total_mail_size = MAX(0, total_mail_size - ?) WHERE id = ?',
    ).bind(mail.size, user!.id),
  ]);

  return success(c, { message: '邮件已删除' });
});

// DELETE /api/mails  批量删除
// Body: { ids: number[] }
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

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 计算待删除邮件总大小
  const placeholders = body.ids.map(() => '?').join(',');
  const { results: mailsToDelete } = await c.env.DB.prepare(
    `SELECT size FROM mails WHERE id IN (${placeholders}) AND user_id = ?`,
  )
    .bind(...body.ids, user.id)
    .all<{ size: number }>();

  const totalSize = mailsToDelete.reduce((sum, m) => sum + m.size, 0);

  // 执行删除
  await c.env.DB.prepare(
    `DELETE FROM mails WHERE id IN (${placeholders}) AND user_id = ?`,
  )
    .bind(...body.ids, user.id)
    .run();

  // 更新用户邮件总大小
  await c.env.DB.prepare(
    'UPDATE users SET total_mail_size = MAX(0, total_mail_size - ?) WHERE id = ?',
  )
    .bind(totalSize, user.id)
    .run();

  return success(c, { deleted: mailsToDelete.length });
});

// GET /api/mails/stats
mailRoutes.get('/stats', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const stats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
      SUM(CASE WHEN is_starred = 1 THEN 1 ELSE 0 END) as starred,
      SUM(size) as total_size
    FROM mails WHERE user_id = ?`,
  )
    .bind(user.id)
    .first<{ total: number; unread: number; starred: number; total_size: number }>();

  return success(c, {
    total: stats?.total ?? 0,
    unread: stats?.unread ?? 0,
    starred: stats?.starred ?? 0,
    total_size: stats?.total_size ?? 0,
  });
});

// PUT /api/mails/:id/read
mailRoutes.put('/:id/read', async (c) => {
  const username = getUsername(c);
  const mailId = parseInt(c.req.param('id'), 10);

  if (isNaN(mailId)) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const mail = await c.env.DB.prepare(
    `SELECT m.id FROM mails m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = ? AND u.username = ?`,
  )
    .bind(mailId, username)
    .first();

  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  await c.env.DB.prepare('UPDATE mails SET is_read = 1 WHERE id = ?')
    .bind(mailId)
    .run();

  return success(c, { message: '已标记为已读' });
});

// PUT /api/mails/:id/unread
mailRoutes.put('/:id/unread', async (c) => {
  const username = getUsername(c);
  const mailId = parseInt(c.req.param('id'), 10);

  if (isNaN(mailId)) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const mail = await c.env.DB.prepare(
    `SELECT m.id FROM mails m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = ? AND u.username = ?`,
  )
    .bind(mailId, username)
    .first();

  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  await c.env.DB.prepare('UPDATE mails SET is_read = 0 WHERE id = ?')
    .bind(mailId)
    .run();

  return success(c, { message: '已标记为未读' });
});

// PUT /api/mails/:id/star
mailRoutes.put('/:id/star', async (c) => {
  const username = getUsername(c);
  const mailId = parseInt(c.req.param('id'), 10);

  if (isNaN(mailId)) {
    return fail(c, 'INVALID_INPUT', '邮件 ID 无效', 400);
  }

  const mail = await c.env.DB.prepare(
    `SELECT m.id, m.is_starred FROM mails m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = ? AND u.username = ?`,
  )
    .bind(mailId, username)
    .first<{ id: number; is_starred: number }>();

  if (!mail) {
    return fail(c, 'NOT_FOUND', '邮件不存在', 404);
  }

  const newStarred = mail.is_starred ? 0 : 1;
  await c.env.DB.prepare('UPDATE mails SET is_starred = ? WHERE id = ?')
    .bind(newStarred, mailId)
    .run();

  return success(c, { is_starred: newStarred === 1 });
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

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const placeholders = body.ids.map(() => '?').join(',');
  await c.env.DB.prepare(
    `UPDATE mails SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`,
  )
    .bind(...body.ids, user.id)
    .run();

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

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const placeholders = body.ids.map(() => '?').join(',');
  await c.env.DB.prepare(
    `UPDATE mails SET is_read = 0 WHERE id IN (${placeholders}) AND user_id = ?`,
  )
    .bind(...body.ids, user.id)
    .run();

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

  const user = await c.env.DB.prepare(
    'SELECT id, has_email FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{ id: number; has_email: number }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  if (user.has_email) {
    return fail(c, 'CONFLICT', '邮箱已注册', 409);
  }

  await c.env.DB.prepare(
    'UPDATE users SET has_email = 1, forward_email = ?, email_enabled = 1 WHERE id = ?',
  )
    .bind(body.forwardEmail || null, user.id)
    .run();

  return success(c, {
    email: `${username}@nomio.world`,
    forwardEmail: body.forwardEmail || null,
    emailEnabled: true,
  });
});
