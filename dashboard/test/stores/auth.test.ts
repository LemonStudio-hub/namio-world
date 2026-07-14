/**
 * auth store 单元测试
 * 测试认证状态管理：登录、注册、登出、Token 管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

// Mock API 模块
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
}));

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}));

import { login as apiLogin, register as apiRegister, getMe } from '@/api/auth';
import router from '@/router';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ---- 初始状态 ----
  describe('初始状态', () => {
    it('未登录时 isLoggedIn 为 false', () => {
      const store = useAuthStore();
      expect(store.isLoggedIn).toBe(false);
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
    });

    it('有 Token 时 isLoggedIn 为 true', () => {
      localStorage.setItem('namio_token', 'existing-token');
      const store = useAuthStore();
      expect(store.token).toBe('existing-token');
      expect(store.isLoggedIn).toBe(true);
    });
  });

  // ---- login ----
  describe('login', () => {
    it('成功登录后设置 token 和 user', async () => {
      const mockUser = { username: 'alice', origin_url: 'https://example.com' };
      vi.mocked(apiLogin).mockResolvedValue({
        success: true,
        data: { token: 'new-jwt-token', user: { username: 'alice' } },
      } as any);
      vi.mocked(getMe).mockResolvedValue({
        success: true,
        data: mockUser,
      } as any);

      const store = useAuthStore();
      await store.login('alice', 'password123');

      expect(store.token).toBe('new-jwt-token');
      expect(store.isLoggedIn).toBe(true);
      expect(localStorage.getItem('namio_token')).toBe('new-jwt-token');
      expect(store.user).toEqual(mockUser);
    });

    it('登录后跳转到 /dashboard', async () => {
      vi.mocked(apiLogin).mockResolvedValue({
        success: true,
        data: { token: 'token', user: { username: 'alice' } },
      } as any);
      vi.mocked(getMe).mockResolvedValue({ success: true, data: {} } as any);

      const store = useAuthStore();
      await store.login('alice', 'password123');

      expect(router.push).toHaveBeenCalledWith('/dashboard');
    });

    it('登录失败时清除状态', async () => {
      vi.mocked(apiLogin).mockRejectedValue(new Error('Unauthorized'));

      const store = useAuthStore();
      await expect(store.login('alice', 'wrong')).rejects.toThrow();

      expect(store.token).toBeNull();
      expect(store.isLoggedIn).toBe(false);
    });

    it('登录期间 loading 为 true', async () => {
      let resolveLogin: any;
      vi.mocked(apiLogin).mockImplementation(
        () => new Promise((resolve) => { resolveLogin = resolve; }),
      );

      const store = useAuthStore();
      const loginPromise = store.login('alice', 'password');

      expect(store.loading).toBe(true);

      resolveLogin({ success: true, data: { token: 't', user: { username: 'a' } } });
      vi.mocked(getMe).mockResolvedValue({ success: true, data: {} } as any);
      await loginPromise;

      expect(store.loading).toBe(false);
    });
  });

  // ---- register ----
  describe('register', () => {
    it('成功注册后设置 token 和 user', async () => {
      vi.mocked(apiRegister).mockResolvedValue({
        success: true,
        data: { token: 'reg-token', user: { username: 'bob' } },
      } as any);
      vi.mocked(getMe).mockResolvedValue({
        success: true,
        data: { username: 'bob' },
      } as any);

      const store = useAuthStore();
      await store.register('bob', 'password123', 'https://bob.example.com');

      expect(store.token).toBe('reg-token');
      expect(store.isLoggedIn).toBe(true);
      expect(localStorage.getItem('namio_token')).toBe('reg-token');
    });

    it('注册后跳转到 /dashboard', async () => {
      vi.mocked(apiRegister).mockResolvedValue({
        success: true,
        data: { token: 't', user: { username: 'b' } },
      } as any);
      vi.mocked(getMe).mockResolvedValue({ success: true, data: {} } as any);

      const store = useAuthStore();
      await store.register('bob', 'pw', 'https://b.com');

      expect(router.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ---- logout ----
  describe('logout', () => {
    it('清除 token 和 user', () => {
      localStorage.setItem('namio_token', 'old-token');

      const store = useAuthStore();
      store.token = 'old-token';
      store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.getItem('namio_token')).toBeNull();
    });

    it('跳转到 /login', () => {
      const store = useAuthStore();
      store.logout();
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  // ---- fetchUser ----
  describe('fetchUser', () => {
    it('成功获取用户信息', async () => {
      localStorage.setItem('namio_token', 'valid-token');
      const mockUser = { username: 'alice', origin_url: 'https://a.com' };
      vi.mocked(getMe).mockResolvedValue({ success: true, data: mockUser } as any);

      const store = useAuthStore();
      await store.fetchUser();

      expect(store.user).toEqual(mockUser);
    });

    it('获取失败时登出', async () => {
      localStorage.setItem('namio_token', 'invalid-token');
      vi.mocked(getMe).mockRejectedValue(new Error('Unauthorized'));

      const store = useAuthStore();
      await store.fetchUser();

      expect(store.token).toBeNull();
      expect(store.isLoggedIn).toBe(false);
    });

    it('无 token 时不发请求', async () => {
      const store = useAuthStore();
      store.token = null;

      await store.fetchUser();

      expect(getMe).not.toHaveBeenCalled();
    });
  });

  // ---- computed ----
  describe('computed properties', () => {
    it('username 返回用户用户名', () => {
      const store = useAuthStore();
      store.user = { username: 'alice' } as any;
      expect(store.username).toBe('alice');
    });

    it('无 user 时 username 为空字符串', () => {
      const store = useAuthStore();
      expect(store.username).toBe('');
    });
  });
});
