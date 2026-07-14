<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const originUrl = ref('');
const error = ref('');

async function handleSubmit() {
  error.value = '';

  if (!username.value || !password.value || !originUrl.value) {
    error.value = '请填写所有必填项';
    return;
  }
  if (password.value.length < 8) {
    error.value = '密码长度至少 8 个字符';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }
  if (!originUrl.value.startsWith('https://')) {
    error.value = '源站地址必须以 https:// 开头';
    return;
  }

  try {
    await auth.register(username.value.toLowerCase(), password.value, originUrl.value);
  } catch (e: any) {
    error.value = e?.data?.error?.message || '注册失败，请稍后重试';
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo">Namio.World</div>
      <p class="subtitle">创建你的数字身份</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="如: alice"
            autocomplete="username"
          />
          <div class="hint">注册后将获得 alice.namio.world 域名</div>
        </div>

        <div class="form-group">
          <label for="originUrl">源站地址</label>
          <input
            id="originUrl"
            v-model="originUrl"
            type="url"
            placeholder="https://myapp.vercel.app"
          />
          <div class="hint">你的网站必须支持 HTTPS</div>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="至少 8 个字符"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="再次输入密码"
            autocomplete="new-password"
          />
        </div>

        <button class="btn btn-primary btn-block" type="submit" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          <span v-else>注册</span>
        </button>
      </form>

      <div class="auth-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>
