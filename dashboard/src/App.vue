<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';

const route = useRoute();
const auth = useAuthStore();

const isAuthPage = computed(() => route.meta.guest === true);
</script>

<template>
  <!-- 认证页面（登录/注册）：无侧边栏 -->
  <div v-if="isAuthPage">
    <router-view />
  </div>

  <!-- 应用主布局：侧边栏 + 内容区 -->
  <div v-else class="app-layout">
    <aside class="app-sidebar">
      <div class="logo">Namio.World</div>
      <nav>
        <router-link to="/dashboard">📊 仪表盘</router-link>
        <router-link to="/domain">🌐 域名管理</router-link>
        <router-link to="/mailbox">📧 邮箱</router-link>
      </nav>
      <div class="user-section">
        <span class="username">{{ auth.username }}</span>
        <button class="btn btn-outline btn-sm" @click="auth.logout()">退出</button>
      </div>
    </aside>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>
