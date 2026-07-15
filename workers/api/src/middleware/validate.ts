/**
 * 输入验证中间件
 */

import { Context, Next } from 'hono';
import { fail } from '../utils/response';

/**
 * 验证请求体 JSON
 */
export async function validateJson(c: Context, next: Next) {
  const contentType = c.req.header('Content-Type');

  if (contentType && !contentType.includes('application/json')) {
    return fail(c, 'INVALID_CONTENT_TYPE', 'Content-Type 必须为 application/json', 400);
  }

  try {
    await c.req.json();
    await next();
  } catch {
    return fail(c, 'INVALID_JSON', '请求体格式无效', 400);
  }
}

/**
 * 验证分页参数
 */
export function parsePagination(c: Context): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * 验证 ID 参数
 */
export function parseId(c: Context, param: string = 'id'): number | null {
  const id = parseInt(c.req.param(param), 10);
  return isNaN(id) ? null : id;
}

/**
 * 验证排序参数
 */
export function parseSort(
  c: Context,
  allowedFields: string[],
  defaultField: string,
  defaultOrder: 'asc' | 'desc' = 'desc'
): { field: string; order: 'asc' | 'desc' } {
  const sortBy = c.req.query('sort_by') || defaultField;
  const sortOrder = (c.req.query('sort_order') || defaultOrder) as 'asc' | 'desc';

  return {
    field: allowedFields.includes(sortBy) ? sortBy : defaultField,
    order: ['asc', 'desc'].includes(sortOrder) ? sortOrder : defaultOrder,
  };
}
