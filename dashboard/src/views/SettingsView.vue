<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMe, changePassword, deleteAccount } from '@/api/auth';
import { getSeoSettings, updateSeoSettings, SEO_VARIANT_OPTIONS, SEO_POSITION_OPTIONS } from '@/api/settings';
import { formatBytes, formatFullDate } from '@/utils/format';
import Icon from '@/components/icons/Icon.vue';
import type { UserProfile } from '@/api/auth';
import type { SeoSettings, SeoVariant, SeoPosition } from '@/api/settings';

const auth = useAuthStore();

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

// Password form
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// SEO settings
const seoSettings = ref<SeoSettings>({
  enabled: true,
  variant: 'default',
  customText: null,
  customStyle: null,
  position: 'bottom-right',
});
const seoLoading = ref(false);
const seoSaving = ref(false);
const activeTab = ref<'account' | 'seo' | 'security'>('account');

onMounted(async () => {
  try {
    const res = await getMe();
    profile.value = res.data;
    await loadSeoSettings();
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
});

async function loadSeoSettings() {
  seoLoading.value = true;
  try {
    const res = await getSeoSettings();
    seoSettings.value = res.data;
  } catch {
    // 静默处理
  } finally {
    seoLoading.value = false;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '从未';
  return formatFullDate(dateStr);
}

async function handleChangePassword() {
  error.value = '';
  success.value = '';

  if (!currentPassword.value || !newPassword.value) {
    error.value = '请填写当前密码和新密码';
    return;
  }
  if (newPassword.value.length < 8) {
    error.value = '新密码长度至少 8 个字符';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致';
    return;
  }

  saving.value = true;
  try {
    await changePassword(currentPassword.value, newPassword.value);
    success.value = '密码修改成功';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (e: any) {
    error.value = e?.data?.error?.message || '修改失败';
  } finally {
    saving.value = false;
  }
}

async function handleSaveSeo() {
  error.value = '';
  success.value = '';
  seoSaving.value = true;

  try {
    await updateSeoSettings(seoSettings.value);
    success.value = 'SEO 设置已保存';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败';
  } finally {
    seoSaving.value = false;
  }
}

function handleSeoVariantChange(variant: SeoVariant) {
  seoSettings.value.variant = variant;
}

function handleSeoPositionChange(position: SeoPosition) {
  seoSettings.value.position = position;
}

async function handleDeleteAccount() {
  const password = prompt('请输入密码以确认删除账号：');
  if (!password) return;

  if (!confirm('确定要删除账号吗？此操作不可撤销，所有数据将被永久删除。')) {
    return;
  }

  try {
    await deleteAccount(password);
    alert('账号已删除');
    auth.logout();
  } catch (e: any) {
    alert(e?.data?.error?.message || '删除失败');
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1>设置</h1>
      <p>管理你的账号设置</p>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span class="spinner"></span>
    </div>

    <template v-else>
      <!-- 标签页导航 -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'account' }"
          @click="activeTab = 'account'"
        >
          <Icon name="user" :size="16" />
          账号信息
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'seo' }"
          @click="activeTab = 'seo'"
        >
          <Icon name="search" :size="16" />
          SEO 设置
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'security' }"
          @click="activeTab = 'security'"
        >
          <Icon name="lock" :size="16" />
          安全设置
        </button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <!-- 账号信息标签页 -->
      <div v-if="activeTab === 'account'" class="tab-content">
        <div class="card">
          <div class="card-title">账号信息</div>
          <table>
            <tbody>
              <tr>
                <td class="label-cell">用户名</td>
                <td>{{ auth.username }}</td>
              </tr>
              <tr>
                <td class="label-cell">域名</td>
                <td>
                  <a :href="`https://${auth.username}.nomio.world`" target="_blank">
                    {{ auth.username }}.nomio.world
                  </a>
                </td>
              </tr>
              <tr>
                <td class="label-cell">邮箱</td>
                <td>{{ auth.username }}@nomio.world</td>
              </tr>
              <tr>
                <td class="label-cell">注册时间</td>
                <td>{{ formatDate(profile?.created_at || null) }}</td>
              </tr>
              <tr>
                <td class="label-cell">最后登录</td>
                <td>{{ formatDate(profile?.last_login_at || null) }}</td>
              </tr>
              <tr>
                <td class="label-cell">存储用量</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 12px">
                    <div class="progress-bar" style="flex: 1; max-width: 200px">
                      <div
                        class="progress-bar-fill"
                        :class="{ danger: (profile?.total_mail_size || 0) / (100 * 1024 * 1024) > 0.9 }"
                        :style="{ width: Math.min(100, ((profile?.total_mail_size || 0) / (100 * 1024 * 1024)) * 100) + '%' }"
                      ></div>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted)">
                      {{ formatBytes(profile?.total_mail_size || 0) }} / 100 MB
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SEO 设置标签页 -->
      <div v-if="activeTab === 'seo'" class="tab-content">
        <div class="card">
          <div class="card-title">SEO 设置</div>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 24px; line-height: 1.6">
            在你的子域名网站底部注入 Nomio.World 链接，帮助提升 SEO 排名。你可以自定义文案和样式。
          </p>

          <div v-if="seoLoading" class="loading-overlay">
            <span class="spinner"></span>
          </div>

          <form v-else @submit.prevent="handleSaveSeo">
            <!-- 启用开关 -->
            <div class="form-group">
              <label class="toggle-label">
                <span class="toggle-switch">
                  <input
                    v-model="seoSettings.enabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </span>
                <span class="toggle-text">启用 SEO 注入</span>
              </label>
              <div class="hint">开启后将在你的网站底部显示 Nomio.World 链接</div>
            </div>

            <template v-if="seoSettings.enabled">
              <!-- 文案变体选择 -->
              <div class="form-group">
                <label>文案风格</label>
                <div class="variant-grid">
                  <div
                    v-for="option in SEO_VARIANT_OPTIONS"
                    :key="option.value"
                    class="variant-card"
                    :class="{ active: seoSettings.variant === option.value }"
                    @click="handleSeoVariantChange(option.value)"
                  >
                    <div class="variant-name">{{ option.label }}</div>
                    <div class="variant-desc">{{ option.description }}</div>
                  </div>
                </div>
              </div>

              <!-- 自定义文案 -->
              <div class="form-group">
                <label for="customText">自定义文案（可选）</label>
                <input
                  id="customText"
                  v-model="seoSettings.customText"
                  type="text"
                  placeholder="留空使用默认文案"
                  class="focus-ring"
                />
                <div class="hint">自定义文案将覆盖上方选择的文案风格</div>
              </div>

              <!-- 位置选择 -->
              <div class="form-group">
                <label>显示位置</label>
                <div class="position-grid">
                  <div
                    v-for="option in SEO_POSITION_OPTIONS"
                    :key="option.value"
                    class="position-card"
                    :class="{ active: seoSettings.position === option.value }"
                    @click="handleSeoPositionChange(option.value)"
                  >
                    <div class="position-preview">
                      <div class="position-screen">
                        <div class="position-dot" :class="option.value"></div>
                      </div>
                    </div>
                    <div class="position-label">{{ option.label }}</div>
                  </div>
                </div>
              </div>

              <!-- 自定义样式 -->
              <div class="form-group">
                <label for="customStyle">自定义 CSS 样式（高级）</label>
                <textarea
                  id="customStyle"
                  v-model="seoSettings.customStyle"
                  placeholder="留空使用默认样式"
                  rows="6"
                  class="focus-ring code-textarea"
                ></textarea>
                <div class="hint">自定义 CSS 将覆盖默认样式，需要以 .nomio-seo-badge 选择器开头</div>
              </div>

              <!-- 预览 -->
              <div class="form-group">
                <label>预览效果</label>
                <div class="seo-preview">
                  <div class="preview-screen">
                    <div class="preview-content">
                      <div class="preview-header">
                        <div class="preview-dot red"></div>
                        <div class="preview-dot yellow"></div>
                        <div class="preview-dot green"></div>
                      </div>
                      <div class="preview-body">
                        <div class="preview-text">你的网站内容...</div>
                      </div>
                    </div>
                    <div
                      class="preview-badge"
                      :class="seoSettings.position"
                    >
                      <span class="badge-icon">N</span>
                      <span class="badge-text">
                        {{ seoSettings.customText || SEO_VARIANT_OPTIONS.find(v => v.value === seoSettings.variant)?.description }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <button class="btn btn-primary" type="submit" :disabled="seoSaving">
              <span v-if="seoSaving" class="spinner"></span>
              <span v-else>保存设置</span>
            </button>
          </form>
        </div>
      </div>

      <!-- 安全设置标签页 -->
      <div v-if="activeTab === 'security'" class="tab-content">
        <!-- 修改密码 -->
        <div class="card">
          <div class="card-title">修改密码</div>
          <form @submit.prevent="handleChangePassword">
            <div class="form-group">
              <label for="currentPassword">当前密码</label>
              <input
                id="currentPassword"
                v-model="currentPassword"
                type="password"
                placeholder="输入当前密码"
                autocomplete="current-password"
                class="focus-ring"
              />
            </div>
            <div class="form-group">
              <label for="newPassword">新密码</label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                placeholder="至少 8 个字符"
                autocomplete="new-password"
                class="focus-ring"
              />
            </div>
            <div class="form-group">
              <label for="confirmPassword">确认新密码</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                autocomplete="new-password"
                class="focus-ring"
              />
            </div>
            <button class="btn btn-primary" type="submit" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              <span v-else>修改密码</span>
            </button>
          </form>
        </div>

        <!-- 危险操作 -->
        <div class="card" style="border-color: #fecaca">
          <div class="card-title" style="color: var(--color-danger)">危险操作</div>
          <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-bottom: 16px; line-height: 1.6">
            删除账号将永久移除你的所有数据，包括域名配置、邮箱和所有邮件。此操作不可撤销。
          </p>
          <button class="btn btn-danger" @click="handleDeleteAccount">删除账号</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.label-cell {
  width: 120px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab:hover {
  color: var(--color-text-secondary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.tab-content {
  animation: fadeIn 0.3s var(--ease);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 切换开关 */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

/* 变体选择网格 */
.variant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.variant-card {
  padding: 16px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.variant-card:hover {
  border-color: var(--color-primary-muted);
  background: var(--color-primary-soft);
}

.variant-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}

.variant-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.variant-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* 位置选择网格 */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.position-card {
  padding: 16px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s var(--ease);
  text-align: center;
}

.position-card:hover {
  border-color: var(--color-primary-muted);
}

.position-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}

.position-preview {
  margin-bottom: 8px;
}

.position-screen {
  width: 60px;
  height: 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  position: relative;
  margin: 0 auto;
}

.position-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
}

.position-dot.bottom-right {
  right: 4px;
  bottom: 4px;
}

.position-dot.bottom-left {
  left: 4px;
  bottom: 4px;
}

.position-dot.bottom-center {
  left: 50%;
  bottom: 4px;
  transform: translateX(-50%);
}

.position-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* 代码文本框 */
.code-textarea {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
}

/* SEO 预览 */
.seo-preview {
  margin-top: 8px;
}

.preview-screen {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  height: 200px;
}

.preview-content {
  padding: 16px;
}

.preview-header {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-dot.red { background: #ff5f57; }
.preview-dot.yellow { background: #febc2e; }
.preview-dot.green { background: #28c840; }

.preview-body {
  padding: 12px;
  background: var(--color-surface);
  border-radius: var(--radius);
}

.preview-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.preview-badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
  z-index: 1;
}

.preview-badge.bottom-right {
  right: 12px;
  bottom: 12px;
}

.preview-badge.bottom-left {
  left: 12px;
  bottom: 12px;
}

.preview-badge.bottom-center {
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}

.badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 4px;
  color: white;
  font-size: 8px;
  font-weight: 700;
}

.badge-text {
  color: var(--color-text-muted);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .variant-grid {
    grid-template-columns: 1fr;
  }

  .position-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab {
    white-space: nowrap;
    flex-shrink: 0;
  }
}
</style>
