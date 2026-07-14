/**
 * 统一响应格式工具
 */

import type { Context } from 'hono';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function success<T>(c: Context, data: T, status = 200) {
  return c.json({ success: true, data } as ApiResponse<T>, status as any);
}

export function fail(c: Context, code: string, message: string, status = 400) {
  return c.json(
    { success: false, error: { code, message } } as ApiResponse,
    status as any,
  );
}
