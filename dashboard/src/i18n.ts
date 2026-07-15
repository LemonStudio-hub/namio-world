import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN';
import en from './locales/en';

// 获取用户语言偏好
function getDefaultLocale(): string {
  const saved = localStorage.getItem('nomio_locale');
  if (saved && ['zh-CN', 'en'].includes(saved)) {
    return saved;
  }

  // 检测浏览器语言
  const browserLang = navigator.language || '';
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en';
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    'en': en,
  },
});

export default i18n;

// 切换语言
export function setLocale(locale: string) {
  i18n.global.locale.value = locale;
  localStorage.setItem('nomio_locale', locale);
  document.documentElement.lang = locale;
}

// 获取当前语言
export function getLocale(): string {
  return i18n.global.locale.value;
}
