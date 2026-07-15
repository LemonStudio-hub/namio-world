<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { computed } from 'vue';

const route = useRoute();
const auth = useAuthStore();
const theme = useThemeStore();

const isPublicPage = computed(() => route.meta.guest === true || route.name === 'Docs' || route.name === 'About');

const navItems = [
  { path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: '仪表盘' },
  { path: '/domain', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', label: '域名管理' },
  { path: '/mailbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: '邮箱' },
  { path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: '设置' },
];

const bottomNavItems = [
  { path: '/docs', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: '帮助' },
  { path: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '关于' },
];
</script>

<template>
  <div v-if="isPublicPage" class="public-page">
    <button class="theme-toggle-float" @click="theme.toggle()" :title="theme.isDark ? '切换到亮色模式' : '切换到暗色模式'">
      <!-- 太阳图标（亮色模式） -->
      <svg v-if="theme.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <!-- 月亮图标（暗色模式） -->
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>

  <div v-else class="app-layout">
    <aside class="app-sidebar">
      <router-link to="/" class="logo-link">
        <div class="logo"><span>Namio</span>.World</div>
      </router-link>
      <nav>
        <router-link v-for="item in navItems" :key="item.path" :to="item.path">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path :d="item.icon" />
            </svg>
          </span>
          {{ item.label }}
        </router-link>
      </nav>
      <div class="nav-bottom">
        <router-link v-for="item in bottomNavItems" :key="item.path" :to="item.path">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path :d="item.icon" />
            </svg>
          </span>
          {{ item.label }}
        </router-link>
        <button class="theme-toggle" @click="theme.toggle()" :title="theme.isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <span class="nav-icon">
            <!-- 太阳图标（亮色模式） -->
            <svg v-if="theme.isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <!-- 月亮图标（暗色模式） -->
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
          {{ theme.isDark ? '亮色模式' : '暗色模式' }}
        </button>
      </div>
      <div class="user-section">
        <div class="user-info">
          <div class="user-avatar">{{ auth.username.charAt(0).toUpperCase() }}</div>
          <span class="username">{{ auth.username }}</span>
        </div>
        <button class="btn btn-outline btn-sm" @click="auth.logout()">退出</button>
      </div>
    </aside>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
/* 浮动主题切换按钮 */
.public-page {
  position: relative;
}

.theme-toggle-float {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary);
}

.theme-toggle-float:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary-muted);
  transform: scale(1.1) rotate(15deg);
  box-shadow: var(--shadow-lg);
}

.theme-toggle-float:active {
  transform: scale(0.95);
}

.logo-link {
  text-decoration: none;
  display: block;
  margin-bottom: 8px;
}

.logo-link:hover {
  transform: none;
}

.nav-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  margin-top: 12px;
}

.nav-bottom a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-bottom a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-bottom a:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateX(4px);
}

.nav-bottom a:hover::before {
  transform: scaleY(1);
}

.nav-bottom a.router-link-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-bottom a.router-link-active::before {
  transform: scaleY(1);
}

/* 主题切换按钮 */
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.theme-toggle:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateX(4px);
}

.theme-toggle .nav-icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-toggle:hover .nav-icon {
  transform: rotate(30deg);
}
</style>
