<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getDomain, updateDomain, verifyDomain } from '@/api/domains';
import type { DomainInfo } from '@/api/domains';

const auth = useAuthStore();

const domain = ref<DomainInfo | null>(null);
const originUrl = ref('');
const originHost = ref('');
const loading = ref(true);
const saving = ref(false);
const verifying = ref(false);
const error = ref('');
const successMsg = ref('');

onMounted(async () => {
  try {
    const res = await getDomain();
    domain.value = res.data;
    originUrl.value = res.data.origin_url;
    originHost.value = res.data.origin_host;
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  error.value = '';
  successMsg.value = '';

  if (!originUrl.value.startsWith('https://')) {
    error.value = '源站地址必须以 https:// 开头';
    return;
  }

  saving.value = true;
  try {
    const res = await updateDomain(originUrl.value, originHost.value || undefined);
    successMsg.value = '源站地址已更新，请重新验证';
    if (domain.value) {
      domain.value.origin_url = originUrl.value;
      domain.value.origin_host = originHost.value;
      domain.value.verify_status = res.data.verifyStatus;
    }
  } catch (e: any) {
    error.value = e?.data?.error?.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function handleVerify() {
  error.value = '';
  successMsg.value = '';
  verifying.value = true;

  try {
    const res = await verifyDomain();
    if (domain.value) {
      domain.value.verify_status = res.data.verifyStatus;
    }
    if (res.data.verifyStatus === 'verified') {
      successMsg.value = '源站验证通过！';
    } else {
      error.value = '源站验证失败，请确保验证文件已正确部署';
    }
  } catch (e: any) {
    error.value = e?.data?.error?.message || '验证请求失败';
  } finally {
    verifying.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1>域名管理</h1>
      <p>管理你的二级域名和源站配置</p>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span class="spinner"></span>
    </div>

    <template v-else>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- 域名信息 -->
      <div class="card">
        <div class="card-title">域名信息</div>
        <table>
          <tbody>
            <tr>
              <td style="width: 140px; color: var(--color-text-secondary)">二级域名</td>
              <td>
                <a :href="`https://${auth.username}.namio.world`" target="_blank">
                  {{ auth.username }}.namio.world
                </a>
              </td>
            </tr>
            <tr>
              <td style="color: var(--color-text-secondary)">验证状态</td>
              <td>
                <span v-if="domain?.verify_status === 'verified'" class="badge badge-success">
                  已验证
                </span>
                <span v-else-if="domain?.verify_status === 'failed'" class="badge badge-danger">
                  验证失败
                </span>
                <span v-else class="badge badge-warning">待验证</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 源站配置 -->
      <div class="card">
        <div class="card-title">源站配置</div>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label for="originUrl">源站地址</label>
            <input
              id="originUrl"
              v-model="originUrl"
              type="url"
              placeholder="https://myapp.vercel.app"
            />
            <div class="hint">必须以 https:// 开头，不支持 IP 地址</div>
          </div>

          <div class="form-group">
            <label for="originHost">回源 Host</label>
            <input
              id="originHost"
              v-model="originHost"
              type="text"
              placeholder="留空则自动使用源站域名"
            />
            <div class="hint">如果你的源站绑定了自定义域名，在此填写</div>
          </div>

          <button class="btn btn-primary" type="submit" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>保存</span>
          </button>
        </form>
      </div>

      <!-- 源站验证 -->
      <div class="card">
        <div class="card-title">源站验证</div>
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 16px">
          为防止恶意指向，需验证你对源站的所有权。请在源站部署以下验证文件：
        </p>
        <div
          style="
            background: var(--color-bg);
            padding: 12px 16px;
            border-radius: var(--radius);
            font-family: monospace;
            font-size: 0.82rem;
            margin-bottom: 16px;
            word-break: break-all;
          "
        >
          文件路径：{{ originUrl.replace(/\/$/, '') }}/.well-known/namio-verify.txt<br />
          文件内容：namio-verify={{ domain?.verify_status === 'verified' ? '***' : '(注册时提供的 Token)' }}
        </div>
        <button class="btn btn-outline" @click="handleVerify" :disabled="verifying">
          <span v-if="verifying" class="spinner"></span>
          <span v-else>验证源站</span>
        </button>
      </div>
    </template>
  </div>
</template>
