/**
 * response.ts 单元测试
 * 测试 success/fail 响应格式
 */

import { describe, it, expect } from 'vitest';
import { success, fail } from '../../src/utils/response';
import { Hono } from 'hono';

// 创建一个最小的 Hono 应用来测试响应辅助函数
function createTestApp() {
  const app = new Hono();

  app.get('/success', (c) => success(c, { name: 'alice' }));
  app.get('/success-custom-status', (c) => success(c, { id: 1 }, 201));
  app.get('/fail', (c) => fail(c, 'TEST_ERROR', '测试错误'));
  app.get('/fail-custom-status', (c) => fail(c, 'NOT_FOUND', '未找到', 404));
  app.get('/success-null', (c) => success(c, null));
  app.get('/success-array', (c) => success(c, [1, 2, 3]));
  app.get('/success-empty-obj', (c) => success(c, {}));

  return app;
}

describe('success', () => {
  const app = createTestApp();

  it('返回 success: true 和 data', async () => {
    const res = await app.request('/success');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { name: 'alice' } });
  });

  it('支持自定义状态码', async () => {
    const res = await app.request('/success-custom-status');
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: 1 } });
  });

  it('支持 null data', async () => {
    const res = await app.request('/success-null');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: null });
  });

  it('支持数组 data', async () => {
    const res = await app.request('/success-array');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: [1, 2, 3] });
  });

  it('支持空对象 data', async () => {
    const res = await app.request('/success-empty-obj');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: {} });
  });

  it('Content-Type 为 application/json', async () => {
    const res = await app.request('/success');
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});

describe('fail', () => {
  const app = createTestApp();

  it('返回 success: false 和 error', async () => {
    const res = await app.request('/fail');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: 'TEST_ERROR', message: '测试错误' },
    });
  });

  it('支持自定义状态码', async () => {
    const res = await app.request('/fail-custom-status');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: '未找到' },
    });
  });

  it('默认状态码为 400', async () => {
    const res = await app.request('/fail');
    expect(res.status).toBe(400);
  });

  it('Content-Type 为 application/json', async () => {
    const res = await app.request('/fail');
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
