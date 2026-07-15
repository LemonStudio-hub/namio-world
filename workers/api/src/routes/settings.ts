/**
 * 设置路由（需 JWT 认证）
 * GET /settings/email   获取邮箱设置
 * PUT /settings/email   更新邮箱设置
 * GET /settings/seo     获取SEO设置
 * PUT /settings/seo     更新SEO设置
 */

import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { getUsername } from '../middleware/auth';
import type { Env } from '../index';

export const settingsRoutes = new Hono<{ Bindings: Env }>();

// GET /api/settings/email
settingsRoutes.get('/email', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT username, email_enabled, total_mail_size FROM users WHERE username = ?',
  )
    .bind(username)
    .first();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, {
    email: `${username}@nomio.world`,
    emailEnabled: !!user.email_enabled,
    totalMailSize: user.total_mail_size,
    quota: 100 * 1024 * 1024, // 100MB
  });
});

// PUT /api/settings/email
// Body: { emailEnabled?: boolean }
settingsRoutes.put('/email', async (c) => {
  const username = getUsername(c);

  let body: { emailEnabled?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  if (body.emailEnabled === undefined) {
    return fail(c, 'INVALID_INPUT', '没有需要更新的字段', 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET email_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
  )
    .bind(body.emailEnabled ? 1 : 0, username)
    .run();

  return success(c, {
    email: `${username}@nomio.world`,
    emailEnabled: body.emailEnabled,
  });
});

// GET /api/settings/seo
settingsRoutes.get('/seo', async (c) => {
  const username = getUsername(c);

  const user = await c.env.DB.prepare(
    'SELECT seo_enabled, seo_variant, seo_custom_text, seo_custom_style, seo_position FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{
      seo_enabled: number;
      seo_variant: string;
      seo_custom_text: string | null;
      seo_custom_style: string | null;
      seo_position: string;
    }>();

  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  return success(c, {
    enabled: !!user.seo_enabled,
    variant: user.seo_variant,
    customText: user.seo_custom_text,
    customStyle: user.seo_custom_style,
    position: user.seo_position,
  });
});

// PUT /api/settings/seo
settingsRoutes.put('/seo', async (c) => {
  const username = getUsername(c);

  let body: {
    enabled?: boolean;
    variant?: string;
    customText?: string | null;
    customStyle?: string | null;
    position?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  // 验证variant
  const validVariants = ['default', 'minimal', 'branded', 'friendly'];
  if (body.variant && !validVariants.includes(body.variant)) {
    return fail(c, 'INVALID_INPUT', '无效的文案变体', 400);
  }

  // 验证position
  const validPositions = ['bottom-right', 'bottom-left', 'bottom-center'];
  if (body.position && !validPositions.includes(body.position)) {
    return fail(c, 'INVALID_INPUT', '无效的位置', 400);
  }

  // 构建更新语句
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.enabled !== undefined) {
    updates.push('seo_enabled = ?');
    values.push(body.enabled ? 1 : 0);
  }
  if (body.variant !== undefined) {
    updates.push('seo_variant = ?');
    values.push(body.variant);
  }
  if (body.customText !== undefined) {
    updates.push('seo_custom_text = ?');
    values.push(body.customText || null);
  }
  if (body.customStyle !== undefined) {
    updates.push('seo_custom_style = ?');
    values.push(body.customStyle || null);
  }
  if (body.position !== undefined) {
    updates.push('seo_position = ?');
    values.push(body.position);
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
    'SELECT seo_enabled, seo_variant, seo_custom_text, seo_custom_style, seo_position FROM users WHERE username = ?',
  )
    .bind(username)
    .first<{
      seo_enabled: number;
      seo_variant: string;
      seo_custom_text: string | null;
      seo_custom_style: string | null;
      seo_position: string;
    }>();

  return success(c, {
    enabled: !!user!.seo_enabled,
    variant: user!.seo_variant,
    customText: user!.seo_custom_text,
    customStyle: user!.seo_custom_style,
    position: user!.seo_position,
  });
});
