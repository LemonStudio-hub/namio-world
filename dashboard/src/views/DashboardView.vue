<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getDomain } from '@/api/domains';
import { getMails } from '@/api/mails';
import type { DomainInfo } from '@/api/domains';
import type { MailListData } from '@/api/mails';

const auth = useAuthStore();

const domain = ref<DomainInfo | null>(null);
const mailData = ref<MailListData | null>(null);
const loading = ref(true);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '从未';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

onMounted(async () => {
  try {
    const [domainRes, mailRes] = await Promise.all([getDomain(), getMails(1, 5)]);
    domain.value = domainRes.data;
    mailData.value = mailRes.data;
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div class="page-header">
      <h1>仪表盘</h1>
      <p>欢迎回来，{{ auth.username }}</p>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span class="spinner"></span>
    </div>

    <template v-else>
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">域名</div>
          <div class="value">{{ auth.username }}.namio.world</div>
        </div>
        <div class="stat-card">
          <div class="label">源站验证</div>
          <div class="value">
            <span :class="verifyBadgeClass">{{ verifyBadgeText }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="label">邮件数量</div>
          <div class="value">{{ mailData?.pagination.total || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="label">邮箱用量</div>
          <div class="value">{{ formatBytes(auth.user?.total_mail_size || 0) }}</div>
        </div>
      </div>

      <!-- 信息卡片 -->
      <div class="card">
        <div class="card-title">账号信息</div>
        <table>
          <tbody>
            <tr>
              <td style="width: 140px; color: var(--color-text-secondary)">用户名</td>
              <td>{{ auth.username }}</td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">域名</td>
              <td>
                <a :href="`https://${auth.username}.namio.world`" target="_blank">
                  {{ auth.username }}.namio.world
                </a>
              </td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">邮箱</td>
              <td>{{ auth.username }}@namio.world</td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">源站</td>
              <td>
                <a v-if="domain" :href="domain.origin_url" target="_blank">
                  {{ domain.origin_url }}
                </a>
              </td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">注册时间</td>
              <td>{{ formatDate(auth.user?.created_at || null) }}</td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">最后登录</td>
              <td>{{ formatDate(auth.user?.last_login_at || null) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 最近邮件 -->
      <div class="card" v-if="mailData && mailData.mails.length > 0">
        <div class="card-title">最近邮件</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>发件人</th>
                <th>主题</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="mail in mailData.mails"
                :key="mail.id"
                :class="{ unread: !mail.is_read }"
              >
                <td>{{ mail.from_address }}</td>
                <td>{{ mail.subject }}</td>
                <td>{{ formatDate(mail.received_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top: 12px; text-align: right">
          <router-link to="/mailbox" class="btn btn-outline btn-sm">查看全部 →</router-link>
        </div>
      </div>
    </template>
  </div>
</template>
