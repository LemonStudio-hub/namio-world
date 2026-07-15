/**
 * auth 路由集成测试
 * 覆盖 POST /register、POST /login、POST /logout、GET /me
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../../src/routes/auth';
import { createMockD1, createTestToken, createRequest, jsonBody, TEST_USER } from '../helpers';
import { hashPassword } from '../../src/utils/password';

const ENV = {
  JWT_SECRET: 'test-secret-key-for-testing',
  ALLOWED_ORIGINS: 'https://nomio.world,https://www.nomio.world',
} as any;

function createTestApp(db: ReturnType<typeof createMockD1>) {
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  return app;
}

function req(app: Hono, request: Request, db: ReturnType<typeof createMockD1>) {
  return app.fetch(request, { ...ENV, DB: db } as any, {} as any);
}

describe('POST /api/auth/register', () => {
  let db: ReturnType<typeof createMockD1>;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    db = createMockD1();
    app = createTestApp(db);
  });

  it('成功注册新用户', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: 'password123' }),
    }), db);
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.username).toBe('alice');
    expect(body.data.user.hasDomain).toBe(false);
    expect(body.data.user.hasEmail).toBe(false);
  });

  it('拒绝重复用户名', async () => {
    await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: 'password123' }),
    }), db);

    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: 'password456' }),
    }), db);
    expect(res.status).toBe(409);
    const body = await res.json() as any;
    expect(body.error.code).toBe('USERNAME_TAKEN');
  });

  it('大写用户名被自动转为小写后接受', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'Alice', password: 'password123' }),
    }), db);
    // 路由会先 toLowerCase()，'Alice' → 'alice' 是合法的
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.data.user.username).toBe('alice');
  });

  it('拒绝保留词用户名', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'admin', password: 'password123' }),
    }), db);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error.message).toContain('保留');
  });

  it('拒绝短密码', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: '1234567' }),
    }), db);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error.message).toContain('密码');
  });

  it('拒绝缺少必填字段', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: jsonBody({ username: 'alice' }),
    }), db);
    expect(res.status).toBe(400);
  });

  it('拒绝无效 JSON', async () => {
    const res = await req(app, createRequest('/api/auth/register', {
      method: 'POST',
      body: 'not json',
    }), db);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  let db: ReturnType<typeof createMockD1>;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    db = createMockD1();
    app = createTestApp(db);
    const passwordHash = await hashPassword('correctpassword');
    db._setTable('users', [{ ...TEST_USER, password_hash: passwordHash }]);
  });

  it('正确凭证登录成功', async () => {
    const res = await req(app, createRequest('/api/auth/login', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: 'correctpassword' }),
    }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
  });

  it('错误密码返回 401', async () => {
    const res = await req(app, createRequest('/api/auth/login', {
      method: 'POST',
      body: jsonBody({ username: 'alice', password: 'wrongpassword' }),
    }), db);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('不存在的用户返回 401', async () => {
    const res = await req(app, createRequest('/api/auth/login', {
      method: 'POST',
      body: jsonBody({ username: 'nobody', password: 'password' }),
    }), db);
    expect(res.status).toBe(401);
  });

  it('缺少字段返回 400', async () => {
    const res = await req(app, createRequest('/api/auth/login', {
      method: 'POST',
      body: jsonBody({ username: 'alice' }),
    }), db);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('返回成功', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/auth/logout', { method: 'POST' }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('有效 Token 返回用户信息', async () => {
    const db = createMockD1();
    db._setTable('users', [TEST_USER]);
    const app = createTestApp(db);
    const token = await createTestToken('alice');
    const res = await req(app, createRequest('/api/auth/me', { token }), db);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('alice');
  });

  it('无效 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/auth/me', { token: 'invalid-token' }), db);
    expect(res.status).toBe(401);
  });

  it('无 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const res = await req(app, createRequest('/api/auth/me'), db);
    expect(res.status).toBe(401);
  });

  it('过期 Token 返回 401', async () => {
    const db = createMockD1();
    const app = createTestApp(db);
    const token = await createTestToken('alice', 'test-secret-key-for-testing', -3600);
    const res = await req(app, createRequest('/api/auth/me', { token }), db);
    expect(res.status).toBe(401);
  });
});
