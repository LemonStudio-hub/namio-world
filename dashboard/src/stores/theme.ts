/**
 * 主题状态管理
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('nomio_theme') as ThemeMode) || 'system');
  const isDark = ref(false);

  // 检测系统暗色模式
  function getSystemDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // 更新主题
  function updateTheme() {
    const html = document.documentElement;
    const systemDark = getSystemDark();

    // 移除所有主题类
    html.classList.remove('light-mode', 'dark-mode');

    if (mode.value === 'system') {
      // 跟随系统偏好
      isDark.value = systemDark;
    } else if (mode.value === 'dark') {
      // 强制暗色模式
      isDark.value = true;
      html.classList.add('dark-mode');
    } else {
      // 强制亮色模式
      isDark.value = false;
      html.classList.add('light-mode');
    }

    // 更新 meta 主题颜色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark.value ? '#0f172a' : '#4f46e5');
    }
  }

  // 设置主题模式
  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem('nomio_theme', newMode);
    updateTheme();
  }

  // 切换暗色/亮色模式
  function toggle() {
    if (mode.value === 'system') {
      // 如果当前是系统模式，切换到与当前相反的模式
      setMode(isDark.value ? 'light' : 'dark');
    } else {
      // 否则在亮色和暗色之间切换
      setMode(mode.value === 'dark' ? 'light' : 'dark');
    }
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (mode.value === 'system') {
      updateTheme();
    }
  });

  // 监听 mode 变化
  watch(mode, updateTheme);

  // 初始化
  updateTheme();

  return { mode, isDark, setMode, toggle };
});
