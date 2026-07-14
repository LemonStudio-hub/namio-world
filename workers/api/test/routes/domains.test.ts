/**
 * domains 路由集成测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { domainRoutes } from '../../src/routes/domains';
import { createMockD1, createTestToken, createRequest, jsonBody, TEST_USER } from '../helpers';

const ENV = {
  JWT_SECRET: 'test-secret-key-for-testing',
  ALLOWED_ORIGINS: 'https://namio.world',
} as any;

function createTestApp(db: ReturnType<typeof createMockD1>) {
  const app = new Hono();
  app.use('/api/domains/*', async (c, next) => {
    const jwtMiddleware = jwt({ secret: ENV.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  });
  app.use('/api/domains', async (c, next) => {
    const jwtMiddleware = jwt({ secret: ENV.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  });
  app.route('/api/domains', domainRoutes);
  return app;
}

function req(app: Hono, request: Request, db: ReturnType<typeof createMockD1>) {
  return app.fetch(request, { ...ENV, DB: db } as any, {} as any);
}

describe('GET /api/domains', () => {
  it('返回用户的域名信息', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', { token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('alice');
    expect(body.data.origin_url).toBe('https://alice.example.com');
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/domains'), db);
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/domains', () => {
  it('更新源站地址', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', {
      method: 'PUT', token,
      body: jsonBody({ originUrl: 'https://new-origin.example.com' }),
    }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.originUrl).toBe('https://new-origin.example.com');
  });

  it('拒绝 HTTP 源站', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', {
      method: 'PUT', token,
      body: jsonBody({ originUrl: 'http://insecure.example.com' }),
    }), db);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error.message).toContain('HTTPS');
  });

  it('拒绝缺少源站地址', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', {
      method: 'PUT', token,
      body: jsonBody({}),
    }), db);
    expect(res.status).toBe(400);
  });

  it('拒绝 IP 地址源站', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', {
      method: 'PUT', token,
      body: jsonBody({ originUrl: 'https://10.0.0.1' }),
    }), db);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/domains', () => {
  it('删除域名（软删除）', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/domains', { method: 'DELETE', token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/domains', { method: 'DELETE' }), db);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/domains/verify', () => {
  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/domains/verify', { method: 'POST' }), db);
    expect(res.status).toBe(401);
  });
});
