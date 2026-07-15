<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getDomain, getDomainStats } from '@/api/domains';
import { getMails, getMailStats } from '@/api/mails';
import { formatBytes, formatFullDate, formatDateShort } from '@/utils/format';
import Icon from '@/components/icons/Icon.vue';
import type { DomainInfo, DomainStats } from '@/api/domains';
import type { MailListData } from '@/api/mails';

const auth = useAuthStore();

const domain = ref<DomainInfo | null>(null);
const domainStats = ref<DomainStats | null>(null);
const mailData = ref<MailListData | null>(null);
const mailStats = ref<{ total: number; unread: number; starred: number; total_size: number } | null>(null);
const loading = ref(true);
const hasDomain = ref(false);
const hasEmail = ref(false);

// 当前时间问候
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 当前日期
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '从未';
  return formatFullDate(dateStr);
}

const verifyBadgeClass = computed(() => {
  const status = domain.value?.verify_status;
  if (status === 'verified') return 'badge badge-success';
  if (status === 'failed') return 'badge badge-danger';
  return 'badge badge-warning';
});

const verifyBadgeText = computed(() => {
  const status = domain.value?.verify_status;
  if (status === 'verified') return '已验证';
  if (status === 'failed') return '验证失败';
  return '待验证';
});

// 计算域名年龄
const domainAge = computed(() => {
  if (!domain.value?.created_at) return null;
  const created = new Date(domain.value.created_at);
  const now = new Date();
  const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return '今天';
  if (days === 1) return '1天';
  if (days < 30) return `${days}天`;
  if (days < 365) return `${Math.floor(days / 30)}个月`;
  return `${Math.floor(days / 365)}年`;
});

onMounted(async () => {
  try {
    const [domainRes, mailRes] = await Promise.allSettled([
      getDomain(),
      getMails({ page: 1, limit: 5 }),
    ]);

    if (domainRes.status === 'fulfilled') {
      domain.value = domainRes.value.data;
      hasDomain.value = true;

      // 加载域名统计
      try {
        const statsRes = await getDomainStats();
        domainStats.value = statsRes.data;
      } catch {
        // 静默处理
      }
    }

    if (mailRes.status === 'fulfilled') {
      mailData.value = mailRes.value.data;
      hasEmail.value = true;

      // 加载邮件统计
      try {
        const statsRes = await getMailStats();
        mailStats.value = statsRes.data;
      } catch {
        // 静默处理
      }
    }
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            {{ greeting }}，<span class="username">{{ auth.username }}</span>
          </h1>
          <p class="welcome-date">{{ currentDate }}</p>
        </div>
        <div class="welcome-actions">
          <router-link v-if="!hasDomain" to="/domain" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            注册域名
          </router-link>
          <router-link v-if="!hasEmail" to="/mailbox" class="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            注册邮箱
          </router-link>
        </div>
      </div>
      <div class="welcome-decoration">
        <div class="decoration-circle c1"></div>
        <div class="decoration-circle c2"></div>
        <div class="decoration-circle c3"></div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <span class="spinner"></span>
        <span>加载中...</span>
      </div>
    </div>

    <template v-else>
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card" style="--delay: 0.1s">
          <div class="stat-icon-wrapper">
            <div class="stat-icon domain-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
          </div>
          <div class="stat-content">
            <div class="stat-label">域名</div>
            <div class="stat-value" v-if="hasDomain">
              <a :href="`https://${auth.username}.nomio.world`" target="_blank" class="domain-link">
                {{ auth.username }}.nomio.world
              </a>
            </div>
            <div class="stat-value" v-else>
              <router-link to="/domain" class="register-link">点击注册</router-link>
            </div>
            <div class="stat-meta" v-if="domainAge">
              已使用 {{ domainAge }}
            </div>
          </div>
        </div>

        <div class="stat-card" style="--delay: 0.2s">
          <div class="stat-icon-wrapper">
            <div class="stat-icon verify-icon" :class="{ verified: domain?.verify_status === 'verified', failed: domain?.verify_status === 'failed' }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div class="stat-content">
            <div class="stat-label">验证状态</div>
            <div class="stat-value">
              <span v-if="hasDomain" :class="verifyBadgeClass">{{ verifyBadgeText }}</span>
              <span v-else class="badge badge-warning">未注册</span>
            </div>
            <div class="stat-meta" v-if="domain?.verify_status === 'verified'">
              源站已验证
            </div>
          </div>
        </div>

        <div class="stat-card" style="--delay: 0.3s">
          <div class="stat-icon-wrapper">
            <div class="stat-icon email-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
          <div class="stat-content">
            <div class="stat-label">邮件数量</div>
            <div class="stat-value" v-if="hasEmail">
              {{ mailStats?.total || 0 }}
              <span class="stat-unit">封</span>
            </div>
            <div class="stat-value" v-else>
              <router-link to="/mailbox" class="register-link">点击注册</router-link>
            </div>
            <div class="stat-meta" v-if="mailStats?.unread">
              {{ mailStats.unread }} 封未读
            </div>
          </div>
        </div>

        <div class="stat-card" style="--delay: 0.4s">
          <div class="stat-icon-wrapper">
            <div class="stat-icon storage-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
          </div>
          <div class="stat-content">
            <div class="stat-label">存储用量</div>
            <div class="stat-value">
              {{ formatBytes(auth.user?.total_mail_size || 0) }}
            </div>
            <div class="stat-meta">
              100 MB 总容量
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <h3 class="section-title">快速操作</h3>
        <div class="actions-grid">
          <router-link to="/domain" class="action-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div class="action-content">
              <h4>域名管理</h4>
              <p>配置源站、验证域名</p>
            </div>
            <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </router-link>

          <router-link to="/mailbox" class="action-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div class="action-content">
              <h4>邮箱管理</h4>
              <p>查看邮件、管理设置</p>
            </div>
            <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </router-link>

          <router-link to="/settings" class="action-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div class="action-content">
              <h4>账号设置</h4>
              <p>修改密码、SEO设置</p>
            </div>
            <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </router-link>

          <router-link to="/docs" class="action-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div class="action-content">
              <h4>帮助文档</h4>
              <p>查看使用指南</p>
            </div>
            <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </router-link>
        </div>
      </div>

      <!-- 账号信息 -->
      <div class="info-section">
        <div class="card">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            账号信息
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">用户名</div>
              <div class="info-value">{{ auth.username }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">域名</div>
              <div class="info-value">
                <a :href="`https://${auth.username}.nomio.world`" target="_blank" class="info-link">
                  {{ auth.username }}.nomio.world
                </a>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ auth.username }}@nomio.world</div>
            </div>
            <div class="info-item">
              <div class="info-label">源站</div>
              <div class="info-value">
                <a v-if="domain" :href="domain.origin_url" target="_blank" class="info-link">
                  {{ domain.origin_url }}
                </a>
                <span v-else class="text-muted">未配置</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">注册时间</div>
              <div class="info-value">{{ formatDate(auth.user?.created_at || null) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">最后登录</div>
              <div class="info-value">{{ formatDate(auth.user?.last_login_at || null) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近邮件 -->
      <div class="mails-section" v-if="mailData && mailData.mails.length > 0">
        <div class="card">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            最近邮件
            <router-link to="/mailbox" class="view-all">查看全部</router-link>
          </div>
          <div class="mail-list">
            <div
              v-for="(mail, index) in mailData.mails"
              :key="mail.id"
              class="mail-item"
              :class="{ unread: !mail.is_read }"
              :style="{ '--delay': `${index * 0.1}s` }"
            >
              <div class="mail-avatar">
                {{ mail.from_address.charAt(0).toUpperCase() }}
              </div>
              <div class="mail-content">
                <div class="mail-header">
                  <span class="mail-from" :class="{ unread: !mail.is_read }">
                    {{ mail.from_address }}
                  </span>
                  <span class="mail-time">{{ formatDateShort(mail.received_at) }}</span>
                </div>
                <div class="mail-subject" :class="{ unread: !mail.is_read }">
                  {{ mail.subject }}
                </div>
              </div>
              <div class="mail-status">
                <div v-if="!mail.is_read" class="unread-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 仪表盘容器 */
.dashboard {
  animation: fadeIn 0.5s var(--ease);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 欢迎区域 */
.welcome-section {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 50%, var(--color-info) 100%);
  border-radius: var(--radius-xl);
  padding: 32px;
  margin-bottom: 32px;
  overflow: hidden;
  color: white;
}

.welcome-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.welcome-title .username {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-date {
  font-size: 0.875rem;
  opacity: 0.9;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.welcome-actions .btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.welcome-actions .btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.welcome-actions .btn-primary {
  background: white;
  color: var(--color-primary);
  border-color: white;
}

.welcome-actions .btn-primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* 装饰圆 */
.welcome-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.decoration-circle.c1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -40px;
  animation: float 6s ease-in-out infinite;
}

.decoration-circle.c2 {
  width: 120px;
  height: 120px;
  bottom: -30px;
  left: 20%;
  animation: float 8s ease-in-out infinite reverse;
}

.decoration-circle.c3 {
  width: 80px;
  height: 80px;
  top: 20%;
  right: 30%;
  animation: float 10s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s var(--ease);
  animation: slideInUp 0.5s var(--ease);
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-muted);
}

.stat-icon-wrapper {
  flex-shrink: 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--ease);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.domain-icon {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.verify-icon {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.verify-icon.verified {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.verify-icon.failed {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.email-icon {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.storage-icon {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.stat-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.domain-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s var(--ease);
}

.domain-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.register-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s var(--ease);
}

.register-link:hover {
  color: var(--color-primary-hover);
}

/* 快速操作 */
.quick-actions {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.3s var(--ease);
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-muted);
}

.action-card:hover .action-icon {
  background: var(--color-primary);
  color: white;
  transform: scale(1.1);
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--ease);
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-content h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.action-content p {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.action-arrow {
  color: var(--color-text-muted);
  transition: all 0.3s var(--ease);
  flex-shrink: 0;
}

/* 信息区域 */
.info-section {
  margin-bottom: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius);
  transition: all 0.2s var(--ease);
}

.info-item:hover {
  background: var(--color-primary-soft);
}

.info-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
  word-break: break-all;
}

.info-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.2s var(--ease);
}

.info-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.text-muted {
  color: var(--color-text-muted);
}

/* 邮件区域 */
.mails-section {
  margin-bottom: 32px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.card-title svg {
  color: var(--color-primary);
}

.view-all {
  margin-left: auto;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.2s var(--ease);
}

.view-all:hover {
  color: var(--color-primary-hover);
}

.mail-list {
  display: flex;
  flex-direction: column;
}

.mail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-light);
  transition: all 0.2s var(--ease);
  animation: slideInUp 0.4s var(--ease);
  animation-delay: var(--delay, 0s);
  animation-fill-mode: both;
  cursor: pointer;
}

.mail-item:last-child {
  border-bottom: none;
}

.mail-item:hover {
  background: var(--color-primary-soft);
}

.mail-item.unread {
  background: var(--color-primary-soft);
}

.mail-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.mail-content {
  flex: 1;
  min-width: 0;
}

.mail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mail-from {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-from.unread {
  font-weight: 700;
  color: var(--color-text);
}

.mail-time {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-left: 12px;
}

.mail-subject {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-subject.unread {
  font-weight: 600;
  color: var(--color-text);
}

.mail-status {
  flex-shrink: 0;
}

.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

/* 加载状态 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.loading-spinner .spinner {
  width: 32px;
  height: 32px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-section {
    padding: 24px;
  }

  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-actions {
    width: 100%;
  }

  .welcome-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .mail-item {
    padding: 12px;
  }

  .mail-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 1.25rem;
  }
}
</style>
