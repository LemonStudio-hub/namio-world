/**
 * 认证状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, register as apiRegister, getMe } from '@/api/auth';
import type { UserProfile } from '@/api/auth';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('namio_token'));
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const username = computed(() => user.value?.username || '');

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const res = await apiLogin({ username, password });
      token.value = res.data.token;
      localStorage.setItem('namio_token', res.data.token);
      await fetchUser();
      router.push('/dashboard');
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, password: string, originUrl: string) {
    loading.value = true;
    try {
      const res = await apiRegister({ username, password, originUrl });
      token.value = res.data.token;
      localStorage.setItem('namio_token', res.data.token);
      await fetchUser();
      router.push('/dashboard');
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const res = await getMe();
      user.value = res.data;
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('namio_token');
    router.push('/login');
  }

  // 初始化时尝试获取用户信息
  if (token.value) {
    fetchUser();
  }

  return { token, user, loading, isLoggedIn, username, login, register, fetchUser, logout };
});
