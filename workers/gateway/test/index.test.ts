/**
 * Gateway Worker 集成测试
 */

import { describe, it, expect } from 'vitest';
import app from '../src/index';

function createMockD1(userData: Record<string, unknown> | null = null) {
  return {
    prepare(_sql: string) {
      return {
        bind(..._args: unknown[]) {
          return { async first() { return userData; } };
        },
      };
    },
  } as unknown as D1Database;
}

function req(request: Request, db: D1Database) {
  return app.fetch(request, { DB: db } as any, {} as any);
}

describe('Gateway Worker', () => {
  it('有效子域名返回源站响应', async () => {
    const db = createMockD1({ origin_url: 'https://example.com', origin_host: 'example.com' });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('Hello from origin', { status: 200 });
    try {
      const res = await req(new Request('https://alice.namio.world/', { headers: { 'CF-Connecting-IP': '1.2.3.4' } }), db);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Hello from origin');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    } finally { globalThis.fetch = originalFetch; }
  });

  it('不存在的子域名返回 404', async () => {
    const db = createMockD1(null);
    const res = await req(new Request('https://nobody.namio.world/'), db);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('未注册');
  });

  it('源站非 HTTPS 返回 502', async () => {
    const db = createMockD1({ origin_url: 'http://insecure.com', origin_host: 'insecure.com' });
    const res = await req(new Request('https://alice.namio.world/'), db);
    expect(res.status).toBe(502);
    expect(await res.text()).toContain('HTTPS');
  });

  it('源站连接失败返回 502', async () => {
    const db = createMockD1({ origin_url: 'https://unreachable.example.com', origin_host: 'unreachable.example.com' });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
    try {
      const res = await req(new Request('https://alice.namio.world/'), db);
      expect(res.status).toBe(502);
      expect(await res.text()).toContain('连接失败');
    } finally { globalThis.fetch = originalFetch; }
  });

  it('传递正确的 Host 头到源站', async () => {
    const db = createMockD1({ origin_url: 'https://my-site.com', origin_host: 'custom-host.com' });
    let capturedHeaders: Headers | null = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, opts) => {
      capturedHeaders = new Headers(opts?.headers as HeadersInit);
      return new Response('ok', { status: 200 });
    };
    try {
      await req(new Request('https://alice.namio.world/page'), db);
      expect(capturedHeaders?.get('Host')).toBe('custom-host.com');
      expect(capturedHeaders?.get('X-Forwarded-Proto')).toBe('https');
    } finally { globalThis.fetch = originalFetch; }
  });

  it('传递 CF-Connecting-IP 到 X-Forwarded-For', async () => {
    const db = createMockD1({ origin_url: 'https://example.com', origin_host: 'example.com' });
    let capturedHeaders: Headers | null = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, opts) => {
      capturedHeaders = new Headers(opts?.headers as HeadersInit);
      return new Response('ok', { status: 200 });
    };
    try {
      await req(new Request('https://alice.namio.world/', { headers: { 'CF-Connecting-IP': '203.0.113.50' } }), db);
      expect(capturedHeaders?.get('X-Forwarded-For')).toBe('203.0.113.50');
      expect(capturedHeaders?.get('X-Real-IP')).toBe('203.0.113.50');
    } finally { globalThis.fetch = originalFetch; }
  });

  it('保留源站响应状态码', async () => {
    const db = createMockD1({ origin_url: 'https://example.com', origin_host: 'example.com' });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('Not Found', { status: 404 });
    try {
      const res = await req(new Request('https://alice.namio.world/missing'), db);
      expect(res.status).toBe(404);
    } finally { globalThis.fetch = originalFetch; }
  });

  it('保留源站响应头', async () => {
    const db = createMockD1({ origin_url: 'https://example.com', origin_host: 'example.com' });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('ok', {
      status: 200,
      headers: { 'X-Custom-Header': 'custom-value', 'Content-Type': 'text/plain' },
    });
    try {
      const res = await req(new Request('https://alice.namio.world/'), db);
      expect(res.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    } finally { globalThis.fetch = originalFetch; }
  });

  it('跟随源站重定向', async () => {
    const db = createMockD1({ origin_url: 'https://example.com', origin_host: 'example.com' });
    const originalFetch = globalThis.fetch;
    // fetch with redirect: 'follow' 会自动跟随，这里模拟最终响应
    globalThis.fetch = async () => new Response('Redirected', { status: 200 });
    try {
      const res = await req(new Request('https://alice.namio.world/old-path'), db);
      expect(res.status).toBe(200);
    } finally { globalThis.fetch = originalFetch; }
  });
});
