<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getDomain, registerDomain, updateDomain, verifyDomain } from '@/api/domains';
import type { DomainInfo } from '@/api/domains';

const auth = useAuthStore();

const domain = ref<DomainInfo | null>(null);
const originUrl = ref('');
const originHost = ref('');
const loading = ref(true);
const saving = ref(false);
const verifying = ref(false);
const registering = ref(false);
const error = ref('');
const successMsg = ref('');

const hasDomain = computed(() => !!domain.value);

onMounted(async () => {
  try {
    const res = await getDomain();
    domain.value = res.data;
    originUrl.value = res.data.origin_url;
    originHost.value = res.data.origin_host;
  } catch {
    // 用户可能还没有注册域名
  } finally {
    loading.value = false;
  }
});

async function handleRegister() {
  error.value = '';
  successMsg.value = '';

  if (!originUrl.value.startsWith('https://')) {
    error.value = '源站地址必须以 https:// 开头';
    return;
  }

  registering.value = true;
  try {
    const res = await registerDomain({
      originUrl: originUrl.value,
      originHost: originHost.value || undefined,
    });
    domain.value = {
      username: auth.username,
      origin_url: res.data.originUrl,
      origin_host: res.data.originHost,
      verify_status: res.data.verifyStatus,
      created_at: new Date().toISOString(),
    };
    successMsg.value = '域名注册成功，请验证源站所有权';
  } catch (e: any) {
    error.value = e?.data?.error?.message || '注册失败';
  } finally {
    registering.value = false;
  }
}

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
      successMsg.value = '源站验证通过';
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
      <p>{{ hasDomain ? '管理你的二级域名和源站配置' : '注册你的二级域名' }}</p>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span class="spinner"></span>
    </div>

    <template v-else>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- 未注册域名时显示注册表单 -->
      <template v-if="!hasDomain">
        <div class="card">
          <div class="card-title">注册二级域名</div>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 20px; line-height: 1.6">
            注册后你将获得 <strong>{{ auth.username }}.nomio.world</strong> 二级域名。
            请填写你的源站信息，注册后需要验证源站所有权。
          </p>
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="originUrl">源站地址</label>
              <input
                id="originUrl"
                v-model="originUrl"
                type="url"
                placeholder="https://myapp.vercel.app"
                class="focus-ring"
              />
              <div class="hint">必须以 https:// 开头，不支持 IP 地址</div>
            </div>

            <div class="form-group">
              <label for="originHost">回源 Host（可选）</label>
              <input
                id="originHost"
                v-model="originHost"
                type="text"
                placeholder="留空则自动使用源站域名"
                class="focus-ring"
              />
              <div class="hint">如果你的源站绑定了自定义域名，在此填写</div>
            </div>

            <button class="btn btn-primary" type="submit" :disabled="registering">
              <span v-if="registering" class="spinner"></span>
              <span v-else>注册域名</span>
            </button>
          </form>
        </div>
      </template>

      <!-- 已注册域名时显示管理界面 -->
      <template v-else>
        <div class="card">
          <div class="card-title">域名信息</div>
          <table>
            <tbody>
              <tr>
                <td style="width: 120px; color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em">二级域名</td>
                <td>
                  <a :href="`https://${auth.username}.nomio.world`" target="_blank">
                    {{ auth.username }}.nomio.world
                  </a>
                </td>
              </tr>
              <tr>
                <td style="color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em">验证状态</td>
                <td>
                  <span v-if="domain?.verify_status === 'verified'" class="badge badge-success">已验证</span>
                  <span v-else-if="domain?.verify_status === 'failed'" class="badge badge-danger">验证失败</span>
                  <span v-else class="badge badge-warning">待验证</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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
                class="focus-ring"
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
                class="focus-ring"
              />
              <div class="hint">如果你的源站绑定了自定义域名，在此填写</div>
            </div>

            <button class="btn btn-primary" type="submit" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              <span v-else>保存</span>
            </button>
          </form>
        </div>

        <div class="card">
          <div class="card-title">源站验证</div>
          <p style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-bottom: 16px; line-height: 1.6">
            为防止恶意指向，需验证你对源站的所有权。请在源站部署以下验证文件：
          </p>
          <div class="code-block">
            文件路径：{{ originUrl.replace(/\/$/, '') }}/.well-known/nomio-verify.txt<br />
            文件内容：nomio-verify={{ domain?.verify_status === 'verified' ? '***' : '(注册时提供的 Token)' }}
          </div>
          <div style="margin-top: 16px">
            <button class="btn btn-outline" @click="handleVerify" :disabled="verifying">
              <span v-if="verifying" class="spinner"></span>
              <span v-else>验证源站</span>
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
