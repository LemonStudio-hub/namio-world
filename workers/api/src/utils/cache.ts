/**
 * 缓存工具
 * 使用 Cloudflare KV 实现简单的缓存层
 */

import type { Env } from '../index';

interface CacheOptions {
  ttl: number;  // 缓存过期时间（秒）
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.kv.get(key, 'json');
      return data as T | null;
    } catch {
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: unknown, options: CacheOptions): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: options.ttl,
      });
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (err) {
      console.error('Cache delete error:', err);
    }
  }

  /**
   * 批量删除缓存（按前缀）
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const list = await this.kv.list({ prefix });
      await Promise.all(
        list.keys.map(key => this.kv.delete(key.name))
      );
    } catch (err) {
      console.error('Cache deleteByPrefix error:', err);
    }
  }
}

/**
 * 缓存键生成器
 */
export const cacheKeys = {
  user: (username: string) => `user:${username}`,
  userById: (id: number) => `user:id:${id}`,
  domain: (username: string) => `domain:${username}`,
  mailStats: (userId: number) => `mail:stats:${userId}`,
  mailList: (userId: number, page: number, limit: number) =>
    `mail:list:${userId}:${page}:${limit}`,
};

/**
 * 缓存 TTL 配置（秒）
 */
export const cacheTtl = {
  user: 300,        // 5 分钟
  domain: 300,      // 5 分钟
  mailStats: 60,    // 1 分钟
  mailList: 30,     // 30 秒
};

/**
 * 获取缓存管理器实例
 */
export function getCache(env: Env): CacheManager | null {
  if (!env.CACHE_KV) {
    return null;
  }
  return new CacheManager(env.CACHE_KV);
}
