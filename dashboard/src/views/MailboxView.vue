<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMails, getMail, deleteMail, deleteMails, registerEmail, markAsRead, markAsUnread, toggleStar, markMultipleAsRead, markMultipleAsUnread } from '@/api/mails';
import { getEmailSettings, updateEmailSettings } from '@/api/settings';
import type { MailItem, MailDetail, Pagination, MailSearchParams } from '@/api/mails';
import type { EmailSettings } from '@/api/settings';

const auth = useAuthStore();

// 邮件列表状态
const mails = ref<MailItem[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
const loading = ref(true);
const selectedIds = ref<Set<number>>(new Set());
const stats = ref({ total: 0, unread: 0, starred: 0, with_attachments: 0, total_size: 0 });

// 邮件详情状态
const currentMail = ref<MailDetail | null>(null);
const detailLoading = ref(false);
const showDetail = ref(false);

// 搜索和筛选状态
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const activeFilter = ref<'all' | 'unread' | 'read' | 'starred'>('all');
const sortBy = ref<'received_at' | 'size' | 'from_address' | 'subject'>('received_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showFilters = ref(false);

// 设置状态
const settings = ref<EmailSettings | null>(null);
const settingsLoading = ref(false);
const forwardEmail = ref('');
const emailEnabled = ref(true);
const settingsSaved = ref(false);
const registering = ref(false);
const registerError = ref('');
const hasEmail = ref(false);

// 标签页状态
const activeTab = ref<'inbox' | 'register' | 'settings'>('inbox');

// 计算属性
const hasSelection = computed(() => selectedIds.value.size > 0);
const allSelected = computed(() => mails.value.length > 0 && selectedIds.value.size === mails.value.length);
const unreadCount = computed(() => stats.value.unread);

// 格式化函数
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 加载邮件列表
async function loadMails(page = 1) {
  loading.value = true;
  try {
    const params: MailSearchParams = {
      page,
      limit: 20,
      search: searchQuery.value || undefined,
      status: activeFilter.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    };

    const res = await getMails(params);
    mails.value = res.data.mails;
    pagination.value = res.data.pagination;
    stats.value = res.data.stats;
    selectedIds.value.clear();
    hasEmail.value = true;
  } catch {
    hasEmail.value = false;
  } finally {
    loading.value = false;
  }
}

// 搜索处理
function handleSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    loadMails(1);
  }, 300);
}

// 筛选处理
function setFilter(filter: 'all' | 'unread' | 'read' | 'starred') {
  activeFilter.value = filter;
  loadMails(1);
}

// 排序处理
function setSort(field: 'received_at' | 'size' | 'from_address' | 'subject') {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'desc';
  }
  loadMails(1);
}

// 注册邮箱
async function handleRegisterEmail() {
  registerError.value = '';
  registering.value = true;
  try {
    const res = await registerEmail(forwardEmail.value || undefined);
    hasEmail.value = true;
    settings.value = {
      email: res.data.email,
      forwardEmail: res.data.forwardEmail,
      emailEnabled: res.data.emailEnabled,
      totalMailSize: 0,
      quota: 100 * 1024 * 1024,
    };
    activeTab.value = 'settings';
  } catch (e: any) {
    registerError.value = e?.data?.error?.message || '注册失败';
  } finally {
    registering.value = false;
  }
}

// 查看邮件详情
async function viewMail(id: number) {
  detailLoading.value = true;
  showDetail.value = true;
  try {
    const res = await getMail(id);
    currentMail.value = res.data;
    // 标记为已读
    const mail = mails.value.find((m) => m.id === id);
    if (mail && !mail.is_read) {
      mail.is_read = true;
      stats.value.unread = Math.max(0, stats.value.unread - 1);
      await markAsRead(id);
    }
  } catch {
    // 静默处理
  } finally {
    detailLoading.value = false;
  }
}

// 关闭详情
function closeDetail() {
  showDetail.value = false;
  currentMail.value = null;
}

// 切换星标
async function handleToggleStar(mail: MailItem) {
  try {
    const res = await toggleStar(mail.id);
    mail.is_starred = res.data.is_starred;
    if (mail.is_starred) {
      stats.value.starred++;
    } else {
      stats.value.starred = Math.max(0, stats.value.starred - 1);
    }
  } catch {
    // 静默处理
  }
}

// 切换已读状态
async function handleToggleRead(mail: MailItem) {
  try {
    if (mail.is_read) {
      await markAsUnread(mail.id);
      mail.is_read = false;
      stats.value.unread++;
    } else {
      await markAsRead(mail.id);
      mail.is_read = true;
      stats.value.unread = Math.max(0, stats.value.unread - 1);
    }
  } catch {
    // 静默处理
  }
}

// 删除邮件
async function handleDeleteMail(id: number) {
  if (!confirm('确定删除这封邮件？')) return;
  try {
    await deleteMail(id);
    mails.value = mails.value.filter((m) => m.id !== id);
    if (currentMail.value?.id === id) {
      closeDetail();
    }
    pagination.value.total--;
    stats.value.total = Math.max(0, stats.value.total - 1);
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

// 批量标记已读
async function handleBatchMarkRead() {
  if (selectedIds.value.size === 0) return;
  try {
    await markMultipleAsRead(Array.from(selectedIds.value));
    mails.value.forEach((mail) => {
      if (selectedIds.value.has(mail.id)) {
        mail.is_read = true;
      }
    });
    stats.value.unread = Math.max(0, stats.value.unread - selectedIds.value.size);
    selectedIds.value.clear();
  } catch {
    alert('操作失败');
  }
}

// 批量标记未读
async function handleBatchMarkUnread() {
  if (selectedIds.value.size === 0) return;
  try {
    await markMultipleAsUnread(Array.from(selectedIds.value));
    mails.value.forEach((mail) => {
      if (selectedIds.value.has(mail.id)) {
        mail.is_read = false;
      }
    });
    stats.value.unread += selectedIds.value.size;
    selectedIds.value.clear();
  } catch {
    alert('操作失败');
  }
}

// 选择处理
function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear();
  } else {
    mails.value.forEach((m) => selectedIds.value.add(m.id));
  }
}

// 设置相关
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

// 分页
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  loadMails(page);
}

// 切换标签页
function switchTab(tab: 'inbox' | 'register' | 'settings') {
  activeTab.value = tab;
  if (tab !== 'inbox') {
    closeDetail();
  }
  if (tab === 'settings' && !settings.value) {
    loadSettings();
  }
}

// 初始化
onMounted(() => loadMails());
</script>

<template>
  <div class="mailbox-container">
    <!-- 注册邮箱页面 -->
    <template v-if="!hasEmail">
      <div class="register-container">
        <div class="register-card">
          <div class="register-icon">📧</div>
          <h2>注册邮箱</h2>
          <p>注册后你将获得 <strong>{{ auth.username }}@nomio.world</strong> 邮箱地址</p>
          <p class="register-hint">任何发送到该地址的邮件都会被接收并存储</p>

          <div v-if="registerError" class="alert alert-error">{{ registerError }}</div>

          <form @submit.prevent="handleRegisterEmail" class="register-form">
            <div class="form-group">
              <label for="forwardEmail">转发邮箱（可选）</label>
              <input
                id="forwardEmail"
                v-model="forwardEmail"
                type="email"
                placeholder="your-email@gmail.com"
                class="focus-ring"
              />
              <div class="hint">收到的邮件将自动转发到此邮箱，留空则不转发</div>
            </div>

            <button class="btn btn-primary btn-block" type="submit" :disabled="registering">
              <span v-if="registering" class="spinner"></span>
              <span v-else>注册邮箱</span>
            </button>
          </form>
        </div>
      </div>
    </template>

    <!-- 邮件客户端主界面 -->
    <template v-else>
      <!-- 顶部工具栏 -->
      <div class="mailbox-toolbar">
        <div class="toolbar-left">
          <h1 class="mailbox-title">
            <span class="title-icon">📬</span>
            收件箱
            <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
          </h1>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-outline btn-sm" @click="switchTab('settings')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            设置
          </button>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="search-filter-bar">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索邮件..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''; handleSearch()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="filter-buttons">
          <button
            class="filter-btn"
            :class="{ active: activeFilter === 'all' }"
            @click="setFilter('all')"
          >
            全部
          </button>
          <button
            class="filter-btn"
            :class="{ active: activeFilter === 'unread' }"
            @click="setFilter('unread')"
          >
            未读
            <span v-if="stats.unread > 0" class="filter-badge">{{ stats.unread }}</span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: activeFilter === 'starred' }"
            @click="setFilter('starred')"
          >
            星标
            <span v-if="stats.starred > 0" class="filter-badge">{{ stats.starred }}</span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: showFilters }"
            @click="showFilters = !showFilters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            筛选
          </button>
        </div>
      </div>

      <!-- 高级筛选面板 -->
      <div v-if="showFilters" class="advanced-filters">
        <div class="filter-group">
          <label>排序方式</label>
          <div class="sort-options">
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'received_at' }"
              @click="setSort('received_at')"
            >
              时间
              <span v-if="sortBy === 'received_at'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'size' }"
              @click="setSort('size')"
            >
              大小
              <span v-if="sortBy === 'size'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'from_address' }"
              @click="setSort('from_address')"
            >
              发件人
              <span v-if="sortBy === 'from_address'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'subject' }"
              @click="setSort('subject')"
            >
              主题
              <span v-if="sortBy === 'subject'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="hasSelection" class="batch-actions">
        <div class="batch-info">
          已选择 <strong>{{ selectedIds.size }}</strong> 封邮件
        </div>
        <div class="batch-buttons">
          <button class="btn btn-outline btn-sm" @click="handleBatchMarkRead">
            标记已读
          </button>
          <button class="btn btn-outline btn-sm" @click="handleBatchMarkUnread">
            标记未读
          </button>
          <button class="btn btn-danger btn-sm" @click="handleBatchDelete">
            删除
          </button>
          <button class="btn btn-outline btn-sm" @click="selectedIds.clear()">
            取消选择
          </button>
        </div>
      </div>

      <!-- 邮件列表和详情布局 -->
      <div class="mailbox-content" :class="{ 'show-detail': showDetail }">
        <!-- 邮件列表 -->
        <div class="mail-list-container">
          <!-- 全选控制 -->
          <div class="list-header">
            <label class="select-all">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
              <span class="select-label">{{ allSelected ? '取消全选' : '全选' }}</span>
            </label>
            <div class="list-stats">
              共 {{ pagination.total }} 封邮件
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner">
              <span class="spinner"></span>
              <span>加载中...</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="mails.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>{{ searchQuery ? '没有找到匹配的邮件' : '收件箱为空' }}</h3>
            <p>{{ searchQuery ? '尝试使用不同的搜索词' : '还没有收到任何邮件' }}</p>
          </div>

          <!-- 邮件列表 -->
          <div v-else class="mail-list">
            <div
              v-for="(mail, index) in mails"
              :key="mail.id"
              class="mail-item"
              :class="{
                unread: !mail.is_read,
                selected: selectedIds.has(mail.id),
                active: currentMail?.id === mail.id
              }"
              :style="{ animationDelay: `${index * 0.03}s` }"
              @click="viewMail(mail.id)"
            >
              <!-- 选择框 -->
              <div class="mail-checkbox" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.has(mail.id)"
                  @change="toggleSelect(mail.id)"
                />
              </div>

              <!-- 星标 -->
              <div class="mail-star" @click.stop="handleToggleStar(mail)">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  :fill="mail.is_starred ? '#f59e0b' : 'none'"
                  :stroke="mail.is_starred ? '#f59e0b' : 'currentColor'"
                  stroke-width="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>

              <!-- 邮件内容 -->
              <div class="mail-content">
                <div class="mail-header">
                  <div class="mail-from" :class="{ unread: !mail.is_read }">
                    {{ truncateText(mail.from_address, 30) }}
                  </div>
                  <div class="mail-time">
                    {{ formatDate(mail.received_at) }}
                  </div>
                </div>
                <div class="mail-subject" :class="{ unread: !mail.is_read }">
                  {{ truncateText(mail.subject, 50) }}
                </div>
                <div class="mail-preview">
                  {{ truncateText(mail.preview || '', 60) }}
                </div>
              </div>

              <!-- 附件指示器 -->
              <div v-if="mail.has_attachments" class="mail-attachment">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </div>

              <!-- 已读/未读指示器 -->
              <div v-if="!mail.is_read" class="mail-unread-dot"></div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="pagination.page <= 1"
              @click="goToPage(pagination.page - 1)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div class="pagination-info">
              <span class="current-page">{{ pagination.page }}</span>
              <span class="separator">/</span>
              <span class="total-pages">{{ pagination.totalPages }}</span>
            </div>
            <button
              class="pagination-btn"
              :disabled="pagination.page >= pagination.totalPages"
              @click="goToPage(pagination.page + 1)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 邮件详情面板 -->
        <div v-if="showDetail" class="mail-detail-container">
          <div v-if="detailLoading" class="detail-loading">
            <span class="spinner"></span>
            <span>加载中...</span>
          </div>

          <div v-else-if="currentMail" class="mail-detail">
            <!-- 详情头部 -->
            <div class="detail-header">
              <div class="detail-actions">
                <button class="action-btn" @click="closeDetail" title="返回列表">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button
                  class="action-btn"
                  :class="{ starred: currentMail.is_starred }"
                  @click="handleToggleStar(currentMail)"
                  :title="currentMail.is_starred ? '取消星标' : '添加星标'"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    :fill="currentMail.is_starred ? '#f59e0b' : 'none'"
                    :stroke="currentMail.is_starred ? '#f59e0b' : 'currentColor'"
                    stroke-width="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
                <button
                  class="action-btn"
                  @click="handleToggleRead(currentMail)"
                  :title="currentMail.is_read ? '标记未读' : '标记已读'"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path v-if="currentMail.is_read" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    <path v-else d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="handleDeleteMail(currentMail.id)" title="删除">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 邮件主题 -->
            <h2 class="detail-subject">{{ currentMail.subject }}</h2>

            <!-- 邮件元信息 -->
            <div class="detail-meta">
              <div class="meta-row">
                <div class="meta-label">发件人</div>
                <div class="meta-value">{{ currentMail.from_address }}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">收件人</div>
                <div class="meta-value">{{ currentMail.to_address }}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">时间</div>
                <div class="meta-value">{{ formatFullDate(currentMail.received_at) }}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">大小</div>
                <div class="meta-value">{{ formatBytes(currentMail.size) }}</div>
              </div>
            </div>

            <!-- 附件列表 -->
            <div v-if="currentMail.attachments && currentMail.attachments.length > 0" class="detail-attachments">
              <div class="attachments-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
                <span>{{ currentMail.attachments.length }} 个附件</span>
              </div>
              <div class="attachments-list">
                <div
                  v-for="(attachment, index) in currentMail.attachments"
                  :key="index"
                  class="attachment-item"
                >
                  <div class="attachment-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <div class="attachment-info">
                    <div class="attachment-name">{{ attachment.filename }}</div>
                    <div class="attachment-size">{{ formatBytes(attachment.size) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 邮件正文 -->
            <div class="detail-body">
              <div v-if="currentMail.html_body" class="html-body" v-html="currentMail.html_body"></div>
              <div v-else class="text-body">{{ currentMail.text_body || currentMail.body }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 邮箱容器 */
.mailbox-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* 注册页面 */
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.register-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 48px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  animation: scaleIn 0.3s var(--ease);
}

.register-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.register-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

.register-card p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  line-height: 1.6;
}

.register-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.register-form {
  text-align: left;
}

/* 工具栏 */
.mailbox-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-bottom: 16px;
}

.mailbox-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.75rem;
}

.unread-badge {
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  min-width: 24px;
  text-align: center;
}

/* 搜索和筛选栏 */
.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  background: var(--color-surface);
  transition: all 0.2s var(--ease);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all 0.2s var(--ease);
}

.clear-search:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.filter-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filter-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
}

.filter-btn.active .filter-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 高级筛选面板 */
.advanced-filters {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
  animation: slideInDown 0.2s var(--ease);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  min-width: 80px;
}

.sort-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.sort-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
}

.sort-btn.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary-muted);
}

.sort-arrow {
  font-size: 0.875rem;
  margin-left: 2px;
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-muted);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  animation: slideInDown 0.2s var(--ease);
}

.batch-info {
  font-size: 0.875rem;
  color: var(--color-primary);
}

.batch-info strong {
  font-weight: 700;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 邮件列表和详情布局 */
.mailbox-content {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

.mailbox-content.show-detail .mail-list-container {
  width: 400px;
  flex-shrink: 0;
}

/* 邮件列表容器 */
.mail-list-container {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.select-all input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.list-stats {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 邮件列表 */
.mail-list {
  flex: 1;
  overflow-y: auto;
}

.mail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.2s var(--ease);
  position: relative;
  animation: slideInUp 0.3s var(--ease);
  animation-fill-mode: both;
}

.mail-item:hover {
  background: var(--color-bg);
}

.mail-item.unread {
  background: var(--color-primary-soft);
}

.mail-item.unread:hover {
  background: var(--color-primary-muted);
}

.mail-item.selected {
  background: var(--color-primary-soft);
  border-left: 3px solid var(--color-primary);
}

.mail-item.active {
  background: var(--color-primary-soft);
  border-left: 3px solid var(--color-primary);
}

.mail-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.mail-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.mail-star {
  flex-shrink: 0;
  padding-top: 2px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.2s var(--ease);
}

.mail-star:hover {
  color: #f59e0b;
  transform: scale(1.1);
}

.mail-content {
  flex: 1;
  min-width: 0;
}

.mail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
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
  font-weight: 600;
  color: var(--color-text);
}

.mail-time {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}

.mail-subject {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-subject.unread {
  font-weight: 600;
  color: var(--color-text);
}

.mail-preview {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-attachment {
  flex-shrink: 0;
  color: var(--color-text-muted);
  padding-top: 2px;
}

.mail-unread-dot {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.current-page {
  font-weight: 600;
  color: var(--color-primary);
}

.separator {
  color: var(--color-text-muted);
}

/* 邮件详情容器 */
.mail-detail-container {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 12px;
  color: var(--color-text-muted);
}

/* 邮件详情 */
.mail-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.action-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.action-btn.starred {
  color: #f59e0b;
  border-color: #f59e0b;
  background: #fffbeb;
}

.action-btn.danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.detail-subject {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  padding: 20px 24px 16px;
  line-height: 1.4;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-meta {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.meta-row {
  display: flex;
  margin-bottom: 8px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-label {
  width: 80px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-top: 2px;
}

.meta-value {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text);
  word-break: break-all;
}

/* 附件 */
.detail-attachments {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.attachments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.attachment-item:hover {
  border-color: var(--color-primary-muted);
  background: var(--color-primary-soft);
}

.attachment-icon {
  color: var(--color-text-muted);
}

.attachment-info {
  min-width: 0;
}

.attachment-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-size {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

/* 邮件正文 */
.detail-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.html-body {
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text);
}

.html-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.html-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
}

.text-body {
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .mailbox-content.show-detail {
    flex-direction: column;
  }

  .mailbox-content.show-detail .mail-list-container {
    width: 100%;
    max-height: 300px;
  }

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .mailbox-container {
    height: auto;
    min-height: calc(100vh - 120px);
  }

  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .batch-buttons {
    justify-content: center;
  }

  .detail-subject {
    font-size: 1.125rem;
    padding: 16px 20px 12px;
  }

  .detail-meta {
    padding: 12px 20px;
  }

  .detail-body {
    padding: 20px;
  }
}
</style>
