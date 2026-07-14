/**
 * 邮箱设置路由（需 JWT 认证）
 * GET /settings/email  获取邮箱设置
 * PUT /settings/email  更新邮箱设置
 */

import { Hono } from 'hono';
import { validateEmail } from '../utils/validator';
import { success, fail } from '../utils/response';
import type { Env } from '../index';

export const settingsRoutes = new Hono<{ Bindings: Env }>();

function getUsername(c: any): string {
  const payload = c.get('jwtPayload') as { sub: string };
  return payload.sub;
}

// GET /api/settings/email
settingsRoutes.get('/email', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT username, forward_email, email_enabled, total_mail_size FROM users WHERE username = ?',
  )
    .bind(username)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, {
    email: `${username}@namio.world`,
    forwardEmail: user.forward_email,
    emailEnabled: !!user.email_enabled,
    totalMailSize: user.total_mail_size,
    quota: 100 * 1024 * 1024, // 100MB
  });
});

// PUT /api/settings/email
// Body: { forwardEmail?: string | null, emailEnabled?: boolean }
settingsRoutes.put('/email', async (c) => {
  const username = getUsername(c);

  let body: { forwardEmail?: string | null; emailEnabled?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  // 校验转发邮箱
  if (body.forwardEmail !== undefined && body.forwardEmail !== null) {
    if (!validateEmail(body.forwardEmail)) {
      return fail(c, 'INVALID_INPUT', '转发邮箱格式无效', 400);
    }
  }

  // 构建更新语句
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.forwardEmail !== undefined) {
    updates.push('forward_email = ?');
    values.push(body.forwardEmail || null);
  }

  if (body.emailEnabled !== undefined) {
    updates.push('email_enabled = ?');
    values.push(body.emailEnabled ? 1 : 0);
  }

  if (updates.length === 0) {
    return fail(c, 'INVALID_INPUT', '没有需要更新的字段', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(username);

  await c.env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE username = ?`,
  )
    .bind(...values)
    .run();

  // 返回更新后的设置
  const user = await c.env.DB.prepare(
    'SELECT username, forward_email, email_enabled FROM users WHERE username = ?',
  )
    .bind(username)
    .first();

  return success(c, {
    email: `${username}@namio.world`,
    forwardEmail: user!.forward_email,
    emailEnabled: !!user!.email_enabled,
  });
});
