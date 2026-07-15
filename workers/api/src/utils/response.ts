/**
 * 统一响应格式工具
 */

import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function success<T>(c: Context, data: T, status: StatusCode = 200) {
  return c.json({ success: true, data } as ApiResponse<T>, status);
}

export function fail(c: Context, code: string, message: string, status: StatusCode = 400) {
  return c.json(
    { success: false, error: { code, message } } as ApiResponse,
    status,
  );
}
