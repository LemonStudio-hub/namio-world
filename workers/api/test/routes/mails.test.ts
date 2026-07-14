/**
 * mails 路由集成测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { mailRoutes } from '../../src/routes/mails';
import { createMockD1, createTestToken, createRequest, jsonBody, TEST_USER, TEST_MAIL } from '../helpers';

const ENV = {
  JWT_SECRET: 'test-secret-key-for-testing',
  ALLOWED_ORIGINS: 'https://namio.world',
} as any;

function createTestApp(db: ReturnType<typeof createMockD1>) {
  const app = new Hono();
  app.use('/api/mails/*', async (c, next) => {
    const jwtMiddleware = jwt({ secret: ENV.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  });
  app.use('/api/mails', async (c, next) => {
    const jwtMiddleware = jwt({ secret: ENV.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  });
  app.route('/api/mails', mailRoutes);
  return app;
}

function req(app: Hono, request: Request, db: ReturnType<typeof createMockD1>) {
  return app.fetch(request, { ...ENV, DB: db } as any, {} as any);
}

describe('GET /api/mails', () => {
  it('返回邮件列表', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [TEST_MAIL]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails', { token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.mails).toBeDefined();
    expect(body.data.pagination).toBeDefined();
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/mails'), db);
    expect(res.status).toBe(401);
  });

  it('支持分页参数', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [TEST_MAIL]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails?page=1&limit=5', { token }), db);
    expect(res.status).toBe(200);
  });

  it('支持 unread 过滤', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [{ ...TEST_MAIL, is_read: 0 }]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails?unread=true', { token }), db);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/mails/:id', () => {
  it('返回邮件详情', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [TEST_MAIL]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails/1', { token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });

  it('无效 ID 返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails/abc', { token }), db);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/mails/1'), db);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/mails/:id', () => {
  it('删除单封邮件', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [TEST_MAIL]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails/1', { method: 'DELETE', token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });

  it('无效 ID 返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails/abc', { method: 'DELETE', token }), db);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/mails (批量)', () => {
  it('批量删除邮件', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    db._setTable('mails', [TEST_MAIL, { ...TEST_MAIL, id: 2, message_id: 'msg-002' }]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails', {
      method: 'DELETE', token,
      body: jsonBody({ ids: [1, 2] }),
    }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(2);
  });

  it('空 ID 列表返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails', {
      method: 'DELETE', token,
      body: jsonBody({ ids: [] }),
    }), db);
    expect(res.status).toBe(400);
  });

  it('缺少 ids 字段返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails', {
      method: 'DELETE', token,
      body: jsonBody({}),
    }), db);
    expect(res.status).toBe(400);
  });

  it('无效 JSON 返回 400', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/mails', {
      method: 'DELETE', token,
      body: 'not-json',
    }), db);
    expect(res.status).toBe(400);
  });
});
