/**
 * 速率限制中间件
 * 使用 Cloudflare KV 存储速率限制数据
 */

import { Context, Next } from 'hono';
import { fail } from '../utils/response';
import type { Env } from '../index';

interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  maxRequests: number;  // 最大请求数
  keyGenerator?: (c: Context) => string;  // 自定义键生成器
}

/**
 * 获取客户端 IP
 */
function getClientIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') ||
         c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
         'unknown';
}

/**
 * 速率限制中间件工厂
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    // 如果没有配置 KV，跳过速率限制
    if (!c.env.RATE_LIMIT_KV) {
      await next();
      return;
    }

    const key = keyGenerator
      ? keyGenerator(c)
      : `rate_limit:${getClientIp(c)}`;

    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // 获取当前窗口的请求记录
      const record = await c.env.RATE_LIMIT_KV.get(key, 'json') as {
        requests: number[];
      } | null;

      const requests = record?.requests || [];

      // 过滤掉过期的请求
      const validRequests = requests.filter(timestamp => timestamp > windowStart);

      if (validRequests.length >= maxRequests) {
        const retryAfter = Math.ceil((validRequests[0] + windowMs - now) / 1000);
        c.header('Retry-After', String(retryAfter));
        c.header('X-RateLimit-Limit', String(maxRequests));
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', String(Math.ceil((validRequests[0] + windowMs) / 1000)));

        return fail(c, 'RATE_LIMITED', '请求过于频繁，请稍后再试', 429);
      }

      // 记录当前请求
      validRequests.push(now);

      // 更新 KV
      await c.env.RATE_LIMIT_KV.put(key, JSON.stringify({ requests: validRequests }), {
        expirationTtl: Math.ceil(windowMs / 1000) + 10,
      });

      // 设置速率限制头
      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', String(maxRequests - validRequests.length));
      c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

      await next();
    } catch (err) {
      // 速率限制出错时放行请求
      console.error('Rate limit error:', err);
      await next();
    }
  };
}

/**
 * 常用速率限制配置
 */
export const rateLimitConfigs = {
  // 登录：每分钟 5 次
  login: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyGenerator: (c) => `rate_limit:login:${getClientIp(c)}`,
  }),

  // 注册：每小时 3 次
  register: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyGenerator: (c) => `rate_limit:register:${getClientIp(c)}`,
  }),

  // API：每分钟 60 次
  api: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 60,
  }),

  // 邮件发送：每小时 10 次
  email: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyGenerator: (c) => {
      const payload = c.get('jwtPayload') as { sub: string } | undefined;
      return `rate_limit:email:${payload?.sub || getClientIp(c)}`;
    },
  }),
};
