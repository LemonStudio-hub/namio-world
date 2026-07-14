<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMails, getMail, deleteMail, deleteMails } from '@/api/mails';
import { getEmailSettings, updateEmailSettings } from '@/api/settings';
import type { MailItem, MailDetail, Pagination } from '@/api/mails';
import type { EmailSettings } from '@/api/settings';

const auth = useAuthStore();

// 邮件列表
const mails = ref<MailItem[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
const loading = ref(true);
const selectedIds = ref<Set<number>>(new Set());

// 邮件详情
const currentMail = ref<MailDetail | null>(null);
const detailLoading = ref(false);

// 邮箱设置
const settings = ref<EmailSettings | null>(null);
const settingsLoading = ref(false);
const forwardEmail = ref('');
const emailEnabled = ref(true);
const settingsSaved = ref(false);

// 标签页
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

// 加载邮件列表
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

// 查看邮件详情
async function viewMail(id: number) {
  detailLoading.value = true;
  try {
    const res = await getMail(id);
    currentMail.value = res.data;
    // 标记为已读
    const mail = mails.value.find((m) => m.id === id);
    if (mail) mail.is_read = true;
  } catch {
    // 静默处理
  } finally {
    detailLoading.value = false;
  }
}

// 删除单封邮件
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

// 批量删除
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

// 加载邮箱设置
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

// 保存邮箱设置
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

// 分页
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  loadMails(page);
}

// 标签页切换
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
      <p>{{ auth.username }}@namio.world</p>
    </div>

    <!-- 标签页切换 -->
    <div style="display: flex; gap: 8px; margin-bottom: 24px">
      <button
        class="btn"
        :class="activeTab === 'inbox' ? 'btn-primary' : 'btn-outline'"
        @click="switchTab('inbox')"
      >
        📥 收件箱
      </button>
      <button
        class="btn"
        :class="activeTab === 'settings' ? 'btn-primary' : 'btn-outline'"
        @click="switchTab('settings')"
      >
        ⚙️ 设置
      </button>
    </div>

    <!-- 收件箱 -->
    <template v-if="activeTab === 'inbox'">
      <!-- 邮件详情 -->
      <div v-if="currentMail" class="card" style="margin-bottom: 20px">
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <div>
            <div class="card-title">{{ currentMail.subject }}</div>
            <div style="font-size: 0.82rem; color: var(--color-text-secondary)">
              来自：{{ currentMail.from_address }} · {{ formatDate(currentMail.received_at) }}
            </div>
          </div>
          <div style="display: flex; gap: 8px">
            <button class="btn btn-outline btn-sm" @click="currentMail = null">返回列表</button>
            <button class="btn btn-danger btn-sm" @click="handleDeleteMail(currentMail!.id)">
              删除
            </button>
          </div>
        </div>
        <div
          style="
            margin-top: 20px;
            padding: 16px;
            background: var(--color-bg);
            border-radius: var(--radius);
            white-space: pre-wrap;
            font-size: 0.88rem;
            line-height: 1.8;
            max-height: 500px;
            overflow-y: auto;
          "
        >
          {{ currentMail.body }}
        </div>
      </div>

      <!-- 操作栏 -->
      <div
        v-if="mails.length > 0"
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px"
      >
        <div style="display: flex; align-items: center; gap: 12px">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer">
            <input
              type="checkbox"
              :checked="selectedIds.size === mails.length && mails.length > 0"
              @change="toggleSelectAll"
            />
            全选
          </label>
          <button
            v-if="selectedIds.size > 0"
            class="btn btn-danger btn-sm"
            @click="handleBatchDelete"
          >
            删除选中 ({{ selectedIds.size }})
          </button>
        </div>
        <div class="info" style="font-size: 0.82rem; color: var(--color-text-muted)">
          共 {{ pagination.total }} 封
        </div>
      </div>

      <!-- 邮件列表 -->
      <div v-if="loading" class="loading-overlay">
        <span class="spinner"></span>
      </div>

      <div v-else-if="mails.length === 0" class="empty-state card">
        <p>📭 收件箱为空</p>
        <p style="font-size: 0.8rem">还没有收到任何邮件</p>
      </div>

      <div v-else class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 36px"></th>
                <th>发件人</th>
                <th>主题</th>
                <th style="width: 80px">大小</th>
                <th style="width: 120px">时间</th>
                <th style="width: 60px"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="mail in mails"
                :key="mail.id"
                :class="{ unread: !mail.is_read }"
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
                  <button class="btn btn-outline btn-sm" @click.stop="handleDeleteMail(mail.id)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">
            上一页
          </button>
          <span class="info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </template>

    <!-- 邮箱设置 -->
    <template v-if="activeTab === 'settings'">
      <div v-if="settingsLoading" class="loading-overlay">
        <span class="spinner"></span>
      </div>

      <template v-else>
        <div v-if="settingsSaved" class="alert alert-success">设置已保存</div>

        <div class="card">
          <div class="card-title">邮箱地址</div>
          <div
            style="
              font-size: 1.1rem;
              font-weight: 600;
              color: var(--color-primary);
              padding: 8px 0;
            "
          >
            {{ auth.username }}@namio.world
          </div>
          <p style="font-size: 0.82rem; color: var(--color-text-muted)">
            此邮箱仅支持接收邮件，不支持发送
          </p>
        </div>

        <div class="card">
          <div class="card-title">邮件转发</div>
          <form @submit.prevent="handleSaveSettings">
            <div class="form-group">
              <label>
                <input v-model="emailEnabled" type="checkbox" style="margin-right: 6px" />
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
              />
              <div class="hint">收到的邮件将自动转发到此邮箱</div>
            </div>

            <button class="btn btn-primary" type="submit">保存设置</button>
          </form>
        </div>

        <div class="card" v-if="settings">
          <div class="card-title">存储用量</div>
          <div style="margin-bottom: 8px">
            <span style="font-weight: 600">{{ formatBytes(settings.totalMailSize) }}</span>
            <span style="color: var(--color-text-muted)"> / {{ formatBytes(settings.quota) }}</span>
          </div>
          <div
            style="
              height: 8px;
              background: var(--color-bg);
              border-radius: 4px;
              overflow: hidden;
            "
          >
            <div
              :style="{
                width: Math.min(100, (settings.totalMailSize / settings.quota) * 100) + '%',
                height: '100%',
                background:
                  settings.totalMailSize / settings.quota > 0.9
                    ? 'var(--color-danger)'
                    : 'var(--color-primary)',
                borderRadius: '4px',
                transition: 'width 0.3s',
              }"
            ></div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
