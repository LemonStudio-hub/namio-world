<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMails, getMail, deleteMail, deleteMails, registerEmail, markAsRead, markAsUnread, toggleStar, markMultipleAsRead, markMultipleAsUnread } from '@/api/mails';
import { getEmailSettings, updateEmailSettings } from '@/api/settings';
import Icon from '@/components/icons/Icon.vue';
import type { MailItem, MailDetail, Pagination, MailSearchParams } from '@/api/mails';
import type { EmailSettings } from '@/api/settings';
import DOMPurify from 'dompurify';

const auth = useAuthStore();

// 安全的HTML净化函数
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}

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
    const res = await registerEmail();
    hasEmail.value = true;
    settings.value = {
      email: res.data.email,
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
          <div class="register-icon"><Icon name="mail" :size="48" /></div>
          <h2>注册邮箱</h2>
          <p>注册后你将获得 <strong>{{ auth.username }}@nomio.world</strong> 邮箱地址</p>
          <p class="register-hint">任何发送到该地址的邮件都会被接收并存储</p>

          <div v-if="registerError" class="alert alert-error">{{ registerError }}</div>

          <form @submit.prevent="handleRegisterEmail" class="register-form">
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
            <span class="title-icon"><Icon name="inbox" :size="24" /></span>
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
            <div class="empty-icon"><Icon name="inbox" :size="64" /></div>
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
              <div v-if="currentMail.html_body" class="html-body" v-html="sanitizeHtml(currentMail.html_body)"></div>
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
  animation: fadeIn 0.5s var(--ease);
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
  box-shadow: var(--shadow-xl);
  animation: scaleIn 0.5s var(--ease-bounce);
  position: relative;
  overflow: hidden;
}

.register-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info));
}

.register-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  animation: bounceIn 0.6s var(--ease-bounce) 0.2s both;
}

.register-card h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  animation: slideInUp 0.5s var(--ease) 0.3s both;
}

.register-card p {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  line-height: 1.6;
  animation: slideInUp 0.5s var(--ease) 0.4s both;
}

.register-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-bottom: 32px;
  animation: slideInUp 0.5s var(--ease) 0.5s both;
}

.register-form {
  text-align: left;
  animation: slideInUp 0.5s var(--ease) 0.6s both;
}

/* 工具栏 */
.mailbox-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  margin-bottom: 20px;
  animation: slideInDown 0.4s var(--ease);
}

.mailbox-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 14px;
  letter-spacing: -0.02em;
}

.title-icon {
  font-size: 2rem;
  animation: bounceIn 0.6s var(--ease-bounce) 0.2s both;
}

.unread-badge {
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  min-width: 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
  animation: pulse 2s var(--ease) infinite;
}

/* 搜索和筛选栏 */
.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  animation: slideInUp 0.4s var(--ease) 0.1s both;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  transition: all 0.3s var(--ease);
}

.search-input {
  width: 100%;
  padding: 12px 44px 12px 48px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-size: 0.9375rem;
  background: var(--color-surface);
  transition: all 0.3s var(--ease);
  box-shadow: var(--shadow-xs);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-glow), var(--shadow-md);
}

.search-input:focus ~ .search-icon {
  color: var(--color-primary);
  transform: translateY(-50%) scale(1.1);
}

.search-input::placeholder {
  color: var(--color-text-muted);
  transition: opacity 0.3s var(--ease);
}

.search-input:focus::placeholder {
  opacity: 0.6;
}

.clear-search {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-bg);
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-full);
  transition: all 0.2s var(--ease);
  opacity: 0;
}

.search-box:hover .clear-search,
.search-input:focus ~ .clear-search {
  opacity: 1;
}

.clear-search:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateY(-50%) scale(1.1);
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s var(--ease);
  position: relative;
  overflow: hidden;
}

.filter-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
  opacity: 0;
  transition: opacity 0.3s var(--ease);
}

.filter-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.filter-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
  transform: translateY(-2px);
}

.filter-btn.active::before {
  opacity: 1;
}

.filter-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.filter-btn.active .filter-badge {
  background: rgba(255, 255, 255, 0.35);
}

/* 高级筛选面板 */
.advanced-filters {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  margin-bottom: 20px;
  animation: slideInDown 0.3s var(--ease-bounce);
  box-shadow: var(--shadow-md);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 90px;
}

.sort-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.sort-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-1px);
}

.sort-btn.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.sort-arrow {
  font-size: 1rem;
  margin-left: 4px;
  animation: fadeIn 0.2s var(--ease);
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--color-primary-soft), rgba(14, 165, 233, 0.08));
  border: 2px solid var(--color-primary-muted);
  border-radius: var(--radius-xl);
  margin-bottom: 20px;
  animation: slideInDown 0.3s var(--ease-bounce);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.batch-info {
  font-size: 0.9375rem;
  color: var(--color-primary);
  font-weight: 600;
}

.batch-info strong {
  font-weight: 800;
  font-size: 1.125rem;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.batch-buttons .btn {
  padding: 8px 16px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  transition: all 0.2s var(--ease);
}

.batch-buttons .btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 邮件列表和详情布局 */
.mailbox-content {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
  animation: fadeIn 0.4s var(--ease) 0.2s both;
}

.mailbox-content.show-detail .mail-list-container {
  width: 420px;
  flex-shrink: 0;
  animation: slideInLeft 0.3s var(--ease);
}

.mailbox-content.show-detail .mail-detail-container {
  animation: slideInRight 0.3s var(--ease);
}

/* 邮件列表容器 */
.mail-list-container {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease);
}

.mail-list-container:hover {
  box-shadow: var(--shadow-md);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: color 0.2s var(--ease);
}

.select-all:hover {
  color: var(--color-primary);
}

.select-all input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
  transition: transform 0.2s var(--ease);
}

.select-all input[type="checkbox"]:checked {
  transform: scale(1.1);
}

.list-stats {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 加载状态 */
.loading-container {
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
  font-size: 0.9375rem;
  font-weight: 500;
}

.loading-spinner .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: bounceIn 0.6s var(--ease-bounce) 0.2s both;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
  animation: slideInUp 0.4s var(--ease) 0.3s both;
}

.empty-state p {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  animation: slideInUp 0.4s var(--ease) 0.4s both;
}

/* 邮件列表 */
.mail-list {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
.mail-list::-webkit-scrollbar {
  width: 6px;
}

.mail-list::-webkit-scrollbar-track {
  background: transparent;
}

.mail-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.mail-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

.mail-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.25s var(--ease);
  position: relative;
  animation: slideInUp 0.4s var(--ease);
  animation-fill-mode: both;
}

.mail-item:nth-child(1) { animation-delay: 0.05s; }
.mail-item:nth-child(2) { animation-delay: 0.1s; }
.mail-item:nth-child(3) { animation-delay: 0.15s; }
.mail-item:nth-child(4) { animation-delay: 0.2s; }
.mail-item:nth-child(5) { animation-delay: 0.25s; }
.mail-item:nth-child(6) { animation-delay: 0.3s; }
.mail-item:nth-child(7) { animation-delay: 0.35s; }
.mail-item:nth-child(8) { animation-delay: 0.4s; }
.mail-item:nth-child(9) { animation-delay: 0.45s; }
.mail-item:nth-child(10) { animation-delay: 0.5s; }

.mail-item:hover {
  background: var(--color-bg);
  transform: translateX(4px);
}

.mail-item.unread {
  background: linear-gradient(135deg, var(--color-primary-soft), rgba(14, 165, 233, 0.05));
  border-left: 3px solid var(--color-primary);
}

.mail-item.unread:hover {
  background: linear-gradient(135deg, var(--color-primary-muted), rgba(14, 165, 233, 0.1));
}

.mail-item.selected {
  background: var(--color-primary-soft);
  border-left: 3px solid var(--color-primary);
  box-shadow: inset 0 0 0 1px var(--color-primary-muted);
}

.mail-item.active {
  background: linear-gradient(135deg, var(--color-primary-soft), rgba(14, 165, 233, 0.08));
  border-left: 4px solid var(--color-primary);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
}

.mail-checkbox {
  flex-shrink: 0;
  padding-top: 3px;
}

.mail-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s var(--ease);
  border-radius: 4px;
}

.mail-checkbox input[type="checkbox"]:checked {
  transform: scale(1.1);
}

.mail-star {
  flex-shrink: 0;
  padding-top: 3px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.3s var(--ease);
}

.mail-star:hover {
  color: #f59e0b;
  transform: scale(1.2) rotate(15deg);
}

.mail-star svg {
  transition: all 0.3s var(--ease);
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
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s var(--ease);
}

.mail-from.unread {
  font-weight: 700;
  color: var(--color-text);
}

.mail-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-left: 12px;
  font-weight: 500;
  transition: color 0.2s var(--ease);
}

.mail-item:hover .mail-time {
  color: var(--color-text-secondary);
}

.mail-subject {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s var(--ease);
}

.mail-subject.unread {
  font-weight: 700;
  color: var(--color-text);
}

.mail-preview {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.mail-attachment {
  flex-shrink: 0;
  color: var(--color-text-muted);
  padding-top: 3px;
  transition: all 0.2s var(--ease);
}

.mail-item:hover .mail-attachment {
  color: var(--color-primary);
}

.mail-unread-dot {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
  animation: pulse 2s var(--ease) infinite;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 18px;
  border-top: 1px solid var(--color-border-light);
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.3s var(--ease);
  box-shadow: var(--shadow-xs);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.pagination-btn:active:not(:disabled) {
  transform: translateY(0);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.current-page {
  font-weight: 800;
  color: var(--color-primary);
  font-size: 1.125rem;
}

.separator {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* 邮件详情容器 */
.mail-detail-container {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
  animation: scaleIn 0.3s var(--ease);
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  gap: 16px;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
}

.detail-loading .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%);
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.3s var(--ease);
  box-shadow: var(--shadow-xs);
}

.action-btn:hover {
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.starred {
  color: #f59e0b;
  border-color: #f59e0b;
  background: var(--color-warning-soft);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.action-btn.starred:hover {
  background: var(--color-warning-soft);
  opacity: 0.8;
  transform: translateY(-2px) scale(1.05);
}

.action-btn.danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
}

.detail-subject {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text);
  padding: 24px 28px 20px;
  line-height: 1.4;
  border-bottom: 1px solid var(--color-border-light);
  letter-spacing: -0.02em;
  animation: slideInUp 0.3s var(--ease) 0.1s both;
}

.detail-meta {
  padding: 20px 28px;
  border-bottom: 1px solid var(--color-border-light);
  animation: slideInUp 0.3s var(--ease) 0.2s both;
}

.meta-row {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-label {
  width: 90px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-top: 3px;
}

.meta-value {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text);
  word-break: break-all;
  font-weight: 500;
  line-height: 1.5;
}

/* 附件 */
.detail-attachments {
  padding: 20px 28px;
  border-bottom: 1px solid var(--color-border-light);
  animation: slideInUp 0.3s var(--ease) 0.3s both;
}

.attachments-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
}

.attachments-header svg {
  color: var(--color-primary);
}

.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s var(--ease);
  min-width: 200px;
}

.attachment-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.attachment-icon {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 8px;
  border-radius: var(--radius);
  transition: all 0.3s var(--ease);
}

.attachment-item:hover .attachment-icon {
  background: var(--color-primary);
  color: white;
  transform: scale(1.1);
}

.attachment-info {
  min-width: 0;
}

.attachment-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.attachment-size {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 邮件正文 */
.detail-body {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
  animation: fadeIn 0.4s var(--ease) 0.4s both;
}

/* 自定义滚动条 */
.detail-body::-webkit-scrollbar {
  width: 6px;
}

.detail-body::-webkit-scrollbar-track {
  background: transparent;
}

.detail-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.detail-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

.html-body {
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--color-text);
}

.html-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s var(--ease);
}

.html-body :deep(a:hover) {
  color: var(--color-primary-hover);
}

.html-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin: 8px 0;
}

.html-body :deep(blockquote) {
  border-left: 4px solid var(--color-primary-muted);
  padding: 12px 20px;
  margin: 16px 0;
  background: var(--color-primary-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-style: italic;
  color: var(--color-text-secondary);
}

.html-body :deep(code) {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.875em;
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

.html-body :deep(pre) {
  background: var(--color-bg);
  padding: 16px;
  border-radius: var(--radius-lg);
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--color-border-light);
}

.html-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text);
}

.text-body {
  font-size: 0.9375rem;
  line-height: 1.8;
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
    max-height: 350px;
  }

  .mailbox-content.show-detail .mail-detail-container {
    animation: slideInUp 0.3s var(--ease);
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

  .mailbox-title {
    font-size: 1.5rem;
  }

  .title-icon {
    font-size: 1.75rem;
  }
}

@media (max-width: 768px) {
  .mailbox-container {
    height: auto;
    min-height: calc(100vh - 120px);
  }

  .mailbox-toolbar {
    padding: 16px 0;
    margin-bottom: 16px;
  }

  .mailbox-title {
    font-size: 1.25rem;
    gap: 10px;
  }

  .title-icon {
    font-size: 1.5rem;
  }

  .unread-badge {
    font-size: 0.6875rem;
    padding: 2px 8px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 12px 16px;
  }

  .batch-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }

  .batch-buttons .btn {
    flex: 1;
    min-width: 80px;
  }

  .detail-subject {
    font-size: 1.125rem;
    padding: 16px 20px 12px;
  }

  .detail-meta {
    padding: 12px 20px;
  }

  .meta-label {
    width: 70px;
    font-size: 0.6875rem;
  }

  .meta-value {
    font-size: 0.875rem;
  }

  .detail-body {
    padding: 20px;
  }

  .detail-attachments {
    padding: 12px 20px;
  }

  .attachments-list {
    flex-direction: column;
  }

  .attachment-item {
    min-width: 100%;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .pagination {
    gap: 12px;
    padding: 12px;
  }

  .pagination-btn {
    width: 36px;
    height: 36px;
  }

  .mail-item {
    padding: 12px 16px;
    gap: 12px;
  }

  .mail-from {
    font-size: 0.8125rem;
  }

  .mail-subject {
    font-size: 0.875rem;
  }

  .mail-preview {
    font-size: 0.75rem;
  }
}

/* 打印样式 */
@media print {
  .mailbox-container {
    height: auto;
  }

  .mailbox-toolbar,
  .search-filter-bar,
  .batch-actions,
  .mail-list-container,
  .detail-header,
  .detail-attachments {
    display: none;
  }

  .mail-detail-container {
    border: none;
    box-shadow: none;
  }

  .detail-body {
    padding: 0;
  }
}
</style>
