/**
 * WAF 规则管理路由（需 JWT 认证）
 * GET    /waf/rules           获取用户的所有WAF规则
 * GET    /waf/rules/:id       获取单条WAF规则
 * POST   /waf/rules           创建自定义WAF规则
 * PUT    /waf/rules/:id       更新WAF规则
 * DELETE /waf/rules/:id       删除WAF规则
 * PUT    /waf/rules/:id/toggle 切换WAF规则启用状态
 * POST   /waf/rules/preset    初始化预设规则
 * GET    /waf/stats           获取WAF统计信息
 * GET    /waf/logs            获取WAF日志
 * DELETE /waf/logs            清空WAF日志
 */

import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { getUsername } from '../middleware/auth';
import { userQueries } from '../utils/db';
import { PRESET_WAF_RULES, WAF_RULE_TYPE_LABELS, WAF_ACTION_LABELS } from '../data/waf-presets';
import type { Env } from '../index';
import type { CreateWafRuleParams, UpdateWafRuleParams } from '../types/waf';

export const wafRoutes = new Hono<{ Bindings: Env }>();

// GET /api/waf/rules
wafRoutes.get('/rules', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM waf_rules WHERE user_id = ? ORDER BY priority ASC, created_at DESC'
  )
    .bind(user.id)
    .all();

  return success(c, results);
});

// GET /api/waf/rules/:id
wafRoutes.get('/rules/:id', async (c) => {
  const username = getUsername(c);
  const ruleId = parseInt(c.req.param('id'), 10);

  if (isNaN(ruleId)) {
    return fail(c, 'INVALID_INPUT', '规则ID无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  const rule = await c.env.DB.prepare(
    'SELECT * FROM waf_rules WHERE id = ? AND user_id = ?'
  )
    .bind(ruleId, user.id)
    .first();

  if (!rule) {
    return fail(c, 'NOT_FOUND', '规则不存在', 404);
  }

  return success(c, rule);
});

// POST /api/waf/rules
wafRoutes.post('/rules', async (c) => {
  const username = getUsername(c);

  let body: CreateWafRuleParams;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  // 验证必填字段
  if (!body.name || !body.rule_type || !body.pattern) {
    return fail(c, 'INVALID_INPUT', '名称、规则类型和匹配模式为必填', 400);
  }

  // 验证规则类型
  const validTypes = Object.keys(WAF_RULE_TYPE_LABELS);
  if (!validTypes.includes(body.rule_type)) {
    return fail(c, 'INVALID_INPUT', '无效的规则类型', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 插入规则
  const result = await c.env.DB.prepare(
    `INSERT INTO waf_rules (user_id, name, description, rule_type, pattern, action, priority, is_enabled, config)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user.id,
      body.name,
      body.description || null,
      body.rule_type,
      body.pattern,
      body.action || 'block',
      body.priority || 100,
      body.is_enabled !== false ? 1 : 0,
      body.config ? JSON.stringify(body.config) : null
    )
    .run();

  return success(c, {
    id: result.meta?.last_row_id,
    message: '规则创建成功',
  }, 201);
});

// PUT /api/waf/rules/:id
wafRoutes.put('/rules/:id', async (c) => {
  const username = getUsername(c);
  const ruleId = parseInt(c.req.param('id'), 10);

  if (isNaN(ruleId)) {
    return fail(c, 'INVALID_INPUT', '规则ID无效', 400);
  }

  let body: UpdateWafRuleParams;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 检查规则是否存在
  const rule = await c.env.DB.prepare(
    'SELECT * FROM waf_rules WHERE id = ? AND user_id = ?'
  )
    .bind(ruleId, user.id)
    .first();

  if (!rule) {
    return fail(c, 'NOT_FOUND', '规则不存在', 404);
  }

  // 构建更新语句
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (body.pattern !== undefined) {
    updates.push('pattern = ?');
    values.push(body.pattern);
  }
  if (body.action !== undefined) {
    updates.push('action = ?');
    values.push(body.action);
  }
  if (body.priority !== undefined) {
    updates.push('priority = ?');
    values.push(body.priority);
  }
  if (body.is_enabled !== undefined) {
    updates.push('is_enabled = ?');
    values.push(body.is_enabled ? 1 : 0);
  }
  if (body.config !== undefined) {
    updates.push('config = ?');
    values.push(JSON.stringify(body.config));
  }

  if (updates.length === 0) {
    return fail(c, 'INVALID_INPUT', '没有需要更新的字段', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(ruleId, user.id);

  await c.env.DB.prepare(
    `UPDATE waf_rules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();

  return success(c, { message: '规则更新成功' });
});

// DELETE /api/waf/rules/:id
wafRoutes.delete('/rules/:id', async (c) => {
  const username = getUsername(c);
  const ruleId = parseInt(c.req.param('id'), 10);

  if (isNaN(ruleId)) {
    return fail(c, 'INVALID_INPUT', '规则ID无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 检查规则是否存在
  const rule = await c.env.DB.prepare(
    'SELECT * FROM waf_rules WHERE id = ? AND user_id = ?'
  )
    .bind(ruleId, user.id)
    .first();

  if (!rule) {
    return fail(c, 'NOT_FOUND', '规则不存在', 404);
  }

  // 删除规则
  await c.env.DB.prepare(
    'DELETE FROM waf_rules WHERE id = ? AND user_id = ?'
  )
    .bind(ruleId, user.id)
    .run();

  return success(c, { message: '规则删除成功' });
});

// PUT /api/waf/rules/:id/toggle
wafRoutes.put('/rules/:id/toggle', async (c) => {
  const username = getUsername(c);
  const ruleId = parseInt(c.req.param('id'), 10);

  if (isNaN(ruleId)) {
    return fail(c, 'INVALID_INPUT', '规则ID无效', 400);
  }

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 切换启用状态
  const rule = await c.env.DB.prepare(
    'SELECT id, is_enabled FROM waf_rules WHERE id = ? AND user_id = ?'
  )
    .bind(ruleId, user.id)
    .first<{ id: number; is_enabled: number }>();

  if (!rule) {
    return fail(c, 'NOT_FOUND', '规则不存在', 404);
  }

  const newEnabled = rule.is_enabled ? 0 : 1;
  await c.env.DB.prepare(
    'UPDATE waf_rules SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
    .bind(newEnabled, ruleId)
    .run();

  return success(c, {
    id: ruleId,
    is_enabled: newEnabled === 1,
    message: newEnabled ? '规则已启用' : '规则已禁用',
  });
});

// POST /api/waf/rules/preset
wafRoutes.post('/rules/preset', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 检查是否已初始化预设规则
  const existing = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM waf_rules WHERE user_id = ? AND is_preset = 1'
  )
    .bind(user.id)
    .first<{ cnt: number }>();

  if (existing && existing.cnt > 0) {
    return fail(c, 'CONFLICT', '预设规则已初始化', 409);
  }

  // 批量插入预设规则
  const stmts = PRESET_WAF_RULES.map((rule) =>
    c.env.DB.prepare(
      `INSERT INTO waf_rules (user_id, name, description, rule_type, pattern, action, priority, is_enabled, is_preset, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`
    )
      .bind(
        user.id,
        rule.name,
        rule.description,
        rule.rule_type,
        rule.pattern,
        rule.action,
        rule.priority,
        rule.config ? JSON.stringify(rule.config) : null
      )
  );

  await c.env.DB.batch(stmts);

  return success(c, {
    message: '预设规则初始化成功',
    count: PRESET_WAF_RULES.length,
  }, 201);
});

// GET /api/waf/stats
wafRoutes.get('/stats', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 获取规则统计
  const ruleStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total_rules,
      SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_rules,
      SUM(CASE WHEN is_preset = 1 THEN 1 ELSE 0 END) as preset_rules,
      SUM(CASE WHEN is_preset = 0 THEN 1 ELSE 0 END) as custom_rules
    FROM waf_rules WHERE user_id = ?`
  )
    .bind(user.id)
    .first<{
      total_rules: number;
      enabled_rules: number;
      preset_rules: number;
      custom_rules: number;
    }>();

  // 获取拦截统计
  const blockStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total_blocked,
      SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as blocked_today
    FROM waf_logs WHERE user_id = ? AND is_blocked = 1`
  )
    .bind(user.id)
    .first<{ total_blocked: number; blocked_today: number }>();

  // 按规则类型统计
  const { results: blockedByType } = await c.env.DB.prepare(
    `SELECT rule_type, COUNT(*) as count
     FROM waf_logs l
     LEFT JOIN waf_rules r ON l.rule_id = r.id
     WHERE l.user_id = ? AND l.is_blocked = 1
     GROUP BY rule_type
     ORDER BY count DESC`
  )
    .bind(user.id)
    .all<{ rule_type: string; count: number }>();

  // 获取最近日志
  const { results: recentLogs } = await c.env.DB.prepare(
    'SELECT * FROM waf_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  )
    .bind(user.id)
    .all();

  return success(c, {
    total_rules: ruleStats?.total_rules || 0,
    enabled_rules: ruleStats?.enabled_rules || 0,
    preset_rules: ruleStats?.preset_rules || 0,
    custom_rules: ruleStats?.custom_rules || 0,
    total_blocked: blockStats?.total_blocked || 0,
    blocked_today: blockStats?.blocked_today || 0,
    blocked_by_type: blockedByType || [],
    recent_logs: recentLogs || [],
  });
});

// GET /api/waf/logs
wafRoutes.get('/logs', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  // 分页参数
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  // 查询总数
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM waf_logs WHERE user_id = ?'
  )
    .bind(user.id)
    .first<{ total: number }>();

  // 查询日志
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM waf_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind(user.id, limit, offset)
    .all();

  return success(c, {
    logs: results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

// DELETE /api/waf/logs
wafRoutes.delete('/logs', async (c) => {
  const username = getUsername(c);

  const user = await userQueries.findByUsername(c.env.DB, username);
  if (!user) {
    return fail(c, 'NOT_FOUND', '用户不存在', 404);
  }

  await c.env.DB.prepare(
    'DELETE FROM waf_logs WHERE user_id = ?'
  )
    .bind(user.id)
    .run();

  return success(c, { message: '日志已清空' });
});
