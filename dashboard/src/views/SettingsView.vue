<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getMe } from '@/api/auth';
import { formatBytes, formatFullDate } from '@/utils/format';
import type { UserProfile } from '@/api/auth';

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

onMounted(async () => {
  try {
    const res = await getMe();
    profile.value = res.data;
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
});

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
    // TODO: 调用修改密码 API
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

function handleDeleteAccount() {
  if (confirm('确定要删除账号吗？此操作不可撤销，所有数据将被永久删除。')) {
    // TODO: 调用删除账号 API
    auth.logout();
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
      <!-- 账号信息 -->
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

      <!-- 修改密码 -->
      <div class="card">
        <div class="card-title">修改密码</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
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
</style>
