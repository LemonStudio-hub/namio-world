/**
 * JWT 认证中间件
 */

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { fail } from '../utils/response';
import type { Env } from '../index';

// JWT Payload 类型
export interface JwtPayload {
  sub: string;  // username
  iat: number;  // issued at
  exp: number;  // expiration
}

/**
 * 从 Context 获取用户名
 */
export function getUsername(c: Context<{ Bindings: Env }>): string {
  const payload = c.get('jwtPayload') as JwtPayload;
  return payload.sub;
}

/**
 * JWT 认证中间件
 */
export async function jwtAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(c, 'UNAUTHORIZED', '缺少认证令牌', 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET) as JwtPayload;

    // 检查令牌是否过期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return fail(c, 'TOKEN_EXPIRED', '认证令牌已过期', 401);
    }

    c.set('jwtPayload', payload);
    await next();
  } catch (err) {
    return fail(c, 'INVALID_TOKEN', '认证令牌无效', 401);
  }
}
