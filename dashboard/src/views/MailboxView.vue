<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMails, getMail, deleteMail, deleteMails } from '@/api/mails';
import { getEmailSettings, updateEmailSettings } from '@/api/settings';
import type { MailItem, MailDetail, Pagination } from '@/api/mails';
import type { EmailSettings } from '@/api/settings';

const auth = useAuthStore();

const mails = ref<MailItem[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
const loading = ref(true);
const selectedIds = ref<Set<number>>(new Set());

const currentMail = ref<MailDetail | null>(null);
const detailLoading = ref(false);

const settings = ref<EmailSettings | null>(null);
const settingsLoading = ref(false);
const forwardEmail = ref('');
const emailEnabled = ref(true);
const settingsSaved = ref(false);

const activeTab = ref<'inbox' | 'settings'>('inbox');

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

async function loadMails(page = 1) {
  loading.value = true;
  try {
    const res = await getMails(page, 20);
    mails.value = res.data.mails;
    pagination.value = res.data.pagination;
    selectedIds.value.clear();
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
}

async function viewMail(id: number) {
  detailLoading.value = true;
  try {
    const res = await getMail(id);
    currentMail.value = res.data;
    const mail = mails.value.find((m) => m.id === id);
    if (mail) mail.is_read = true;
  } catch {
    // 静默处理
  } finally {
    detailLoading.value = false;
  }
}

async function handleDeleteMail(id: number) {
  if (!confirm('确定删除这封邮件？')) return;
  try {
    await deleteMail(id);
    mails.value = mails.value.filter((m) => m.id !== id);
    if (currentMail.value?.id === id) currentMail.value = null;
    pagination.value.total--;
  } catch {
    alert('删除失败');
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.size === 0) return;
  if (!confirm(`确定删除选中的 ${selectedIds.value.size} 封邮件？`)) return;
  try {
    await deleteMails(Array.from(selectedIds.value));
    await loadMails(pagination.value.page);
  } catch {
    alert('删除失败');
  }
}

function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
}

function toggleSelectAll() {
  if (selectedIds.value.size === mails.value.length) {
    selectedIds.value.clear();
  } else {
    mails.value.forEach((m) => selectedIds.value.add(m.id));
  }
}

async function loadSettings() {
  settingsLoading.value = true;
  try {
    const res = await getEmailSettings();
    settings.value = res.data;
    forwardEmail.value = res.data.forwardEmail || '';
    emailEnabled.value = res.data.emailEnabled;
  } catch {
    // 静默处理
  } finally {
    settingsLoading.value = false;
  }
}

async function handleSaveSettings() {
  try {
    await updateEmailSettings({
      forwardEmail: forwardEmail.value || null,
      emailEnabled: emailEnabled.value,
    });
    settingsSaved.value = true;
    setTimeout(() => (settingsSaved.value = false), 3000);
  } catch {
    alert('保存失败');
  }
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  loadMails(page);
}

function switchTab(tab: 'inbox' | 'settings') {
  activeTab.value = tab;
  currentMail.value = null;
  if (tab === 'settings' && !settings.value) {
    loadSettings();
  }
}

onMounted(() => loadMails());
</script>

<template>
  <div>
    <div class="page-header">
      <h1>邮箱管理</h1>
      <p>{{ auth.username }}@nomio.world</p>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'inbox' }" @click="switchTab('inbox')">收件箱</button>
      <button class="tab" :class="{ active: activeTab === 'settings' }" @click="switchTab('settings')">设置</button>
    </div>

    <!-- 收件箱 -->
    <template v-if="activeTab === 'inbox'">
      <div v-if="currentMail" class="card" style="margin-bottom: 20px">
        <div class="mail-detail-header">
          <div>
            <div class="card-title">{{ currentMail.subject }}</div>
            <div class="mail-detail-meta">
              来自：{{ currentMail.from_address }} · {{ formatDate(currentMail.received_at) }}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-shrink: 0">
            <button class="btn btn-outline btn-sm" @click="currentMail = null">返回列表</button>
            <button class="btn btn-danger btn-sm" @click="handleDeleteMail(currentMail!.id)">删除</button>
          </div>
        </div>
        <div class="mail-body">{{ currentMail.body }}</div>
      </div>

      <div v-if="mails.length > 0" class="toolbar">
        <div class="toolbar-left">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-text-muted); cursor: pointer">
            <input
              type="checkbox"
              :checked="selectedIds.size === mails.length && mails.length > 0"
              @change="toggleSelectAll"
            />
            全选
          </label>
          <button v-if="selectedIds.size > 0" class="btn btn-danger btn-sm" @click="handleBatchDelete">
            删除选中 ({{ selectedIds.size }})
          </button>
        </div>
        <div class="toolbar-right">共 {{ pagination.total }} 封</div>
      </div>

      <div v-if="loading" class="loading-overlay">
        <span class="spinner"></span>
      </div>

      <div v-else-if="mails.length === 0" class="empty-state card">
        <p style="font-size: 1.5rem; margin-bottom: 8px">--</p>
        <p>收件箱为空</p>
        <p style="font-size: 0.75rem; color: var(--color-text-muted)">还没有收到任何邮件</p>
      </div>

      <div v-else class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 36px"></th>
                <th>发件人</th>
                <th>主题</th>
                <th style="width: 72px">大小</th>
                <th style="width: 100px">时间</th>
                <th style="width: 56px"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(mail, index) in mails"
                :key="mail.id"
                :class="{ unread: !mail.is_read }"
                :style="{ animationDelay: `${index * 0.05}s` }"
                class="mail-row"
                style="cursor: pointer"
              >
                <td @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(mail.id)"
                    @change="toggleSelect(mail.id)"
                  />
                </td>
                <td @click="viewMail(mail.id)">{{ mail.from_address }}</td>
                <td @click="viewMail(mail.id)">{{ mail.subject }}</td>
                <td @click="viewMail(mail.id)">{{ formatBytes(mail.size) }}</td>
                <td @click="viewMail(mail.id)">{{ formatDate(mail.received_at) }}</td>
                <td>
                  <button class="btn btn-outline btn-sm" @click.stop="handleDeleteMail(mail.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">上一页</button>
          <span class="info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button :disabled="pagination.page >= pagination.totalPages" @click="goToPage(pagination.page + 1)">下一页</button>
        </div>
      </div>
    </template>

    <!-- 设置 -->
    <template v-if="activeTab === 'settings'">
      <div v-if="settingsLoading" class="loading-overlay">
        <span class="spinner"></span>
      </div>

      <template v-else>
        <div v-if="settingsSaved" class="alert alert-success">设置已保存</div>

        <div class="card">
          <div class="card-title">邮箱地址</div>
          <div style="font-size: 1.125rem; font-weight: 700; color: var(--color-primary); padding: 4px 0 8px; letter-spacing: -0.01em">
            {{ auth.username }}@nomio.world
          </div>
          <p style="font-size: 0.75rem; color: var(--color-text-muted)">此邮箱仅支持接收邮件，不支持发送</p>
        </div>

        <div class="card">
          <div class="card-title">邮件转发</div>
          <form @submit.prevent="handleSaveSettings">
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer">
                <input v-model="emailEnabled" type="checkbox" />
                启用邮箱功能
              </label>
            </div>

            <div class="form-group">
              <label for="forwardEmail">转发邮箱</label>
              <input
                id="forwardEmail"
                v-model="forwardEmail"
                type="email"
                placeholder="your-email@gmail.com（留空则不转发）"
                class="focus-ring"
              />
              <div class="hint">收到的邮件将自动转发到此邮箱</div>
            </div>

            <button class="btn btn-primary" type="submit">保存设置</button>
          </form>
        </div>

        <div class="card" v-if="settings">
          <div class="card-title">存储用量</div>
          <div style="margin-bottom: 10px">
            <span style="font-weight: 700; font-size: 0.875rem">{{ formatBytes(settings.totalMailSize) }}</span>
            <span style="color: var(--color-text-muted); font-size: 0.75rem"> / {{ formatBytes(settings.quota) }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :class="{ danger: settings.totalMailSize / settings.quota > 0.9 }"
              :style="{ width: Math.min(100, (settings.totalMailSize / settings.quota) * 100) + '%' }"
            ></div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.mail-row {
  animation: slideInUp 0.5s var(--ease);
  animation-fill-mode: both;
}
</style>
