/**
 * API request 封装测试
 * 测试 Token 注入、401 处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ofetch
const mockCreate = vi.fn();
vi.mock('ofetch', () => ({
  ofetch: { create: mockCreate },
}));

describe('request', () => {
  let onRequestHandler: any;
  let onResponseErrorHandler: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    mockCreate.mockImplementation((config: any) => {
      onRequestHandler = config.onRequest;
      onResponseErrorHandler = config.onResponseError;
      return vi.fn();
    });

    // 重新导入以触发 mock
    vi.resetModules();
  });

  it('创建时配置 baseURL 为 /api', async () => {
    await import('@/api/request');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' }),
    );
  });

  it('onRequest 从 localStorage 读取 Token 并注入', async () => {
    localStorage.setItem('namio_token', 'my-jwt-token');
    await import('@/api/request');

    const options = { headers: {} as any };
    onRequestHandler({ options });

    expect(options.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('onRequest 无 Token 时不注入 Authorization', async () => {
    await import('@/api/request');

    const options = { headers: {} as any };
    onRequestHandler({ options });

    expect(options.headers.Authorization).toBeUndefined();
  });

  it('onResponseError 401 时清除 Token', async () => {
    localStorage.setItem('namio_token', 'expired-token');
    await import('@/api/request');

    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { pathname: '/dashboard', href: '' } as any;

    onResponseErrorHandler({ response: { status: 401 } });

    expect(localStorage.getItem('namio_token')).toBeNull();

    // @ts-ignore
    window.location = originalLocation;
  });
});
