/**
 * settings 路由集成测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { settingsRoutes } from '../../src/routes/settings';
import { createMockD1, createTestToken, createRequest, jsonBody, TEST_USER } from '../helpers';

const ENV = {
  JWT_SECRET: 'test-secret-key-for-testing',
  ALLOWED_ORIGINS: 'https://namio.world',
} as any;

function createTestApp(db: ReturnType<typeof createMockD1>) {
  const app = new Hono();
  app.use('/api/settings/*', async (c, next) => {
    const jwtMiddleware = jwt({ secret: ENV.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  });
  app.route('/api/settings', settingsRoutes);
  return app;
}

function req(app: Hono, request: Request, db: ReturnType<typeof createMockD1>) {
  return app.fetch(request, { ...ENV, DB: db } as any, {} as any);
}

describe('GET /api/settings/email', () => {
  it('返回邮箱设置', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', { token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('alice@namio.world');
    expect(body.data.quota).toBe(100 * 1024 * 1024);
  });

  it('包含转发邮箱设置', async () => {
    const db = createMockD1();
    db._setTable('users', [{ ...TEST_USER, forward_email: 'bob@gmail.com' }]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', { token }), db);
    const body = await res.json() as any;
    expect(body.data.forwardEmail).toBe('bob@gmail.com');
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/settings/email'), db);
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/settings/email', () => {
  it('更新转发邮箱', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT', token,
      body: jsonBody({ forwardEmail: 'new@gmail.com' }),
    }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });

  it('清空转发邮箱', async () => {
    const db = createMockD1();
    db._setTable('users', [{ ...TEST_USER, forward_email: 'old@gmail.com' }]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT', token,
      body: jsonBody({ forwardEmail: null }),
    }), db);
    expect(res.status).toBe(200);
  });

  it('切换邮箱开关', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT', token,
      body: jsonBody({ emailEnabled: false }),
    }), db);
    expect(res.status).toBe(200);
  });

  it('拒绝无效邮箱格式', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT', token,
      body: jsonBody({ forwardEmail: 'not-an-email' }),
    }), db);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error.message).toContain('邮箱');
  });

  it('空请求体返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT', token,
      body: jsonBody({}),
    }), db);
    expect(res.status).toBe(400);
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/settings/email', {
      method: 'PUT',
      body: jsonBody({ forwardEmail: 'test@gmail.com' }),
    }), db);
    expect(res.status).toBe(401);
  });
});
