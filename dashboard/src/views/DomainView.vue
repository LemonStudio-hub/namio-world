<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getDomain, getDomainStats, registerDomain, updateDomain, verifyDomain } from '@/api/domains';
import {
  getWafRules,
  createWafRule,
  updateWafRule,
  deleteWafRule,
  toggleWafRule,
  initPresetRules,
  getWafStats,
  WAF_RULE_TYPE_LABELS,
  WAF_ACTION_LABELS,
  WAF_ACTION_COLORS,
  WAF_RULE_TYPE_ICONS,
} from '@/api/waf';
import { formatBytes, formatFullDate, formatDateShort } from '@/utils/format';
import Icon from '@/components/icons/Icon.vue';
import type { DomainInfo, DomainStats } from '@/api/domains';
import type { WafRule, WafStats, CreateWafRuleParams, WafRuleType, WafAction } from '@/api/waf';

const auth = useAuthStore();

const domain = ref<DomainInfo | null>(null);
const stats = ref<DomainStats | null>(null);
const originUrl = ref('');
const originHost = ref('');
const loading = ref(true);
const statsLoading = ref(false);
const saving = ref(false);
const verifying = ref(false);
const registering = ref(false);
const error = ref('');
const successMsg = ref('');
const activeTab = ref<'overview' | 'settings' | 'verify' | 'waf'>('overview');

const hasDomain = computed(() => !!domain.value);

onMounted(async () => {
  try {
    const res = await getDomain();
    domain.value = res.data;
    originUrl.value = res.data.origin_url;
    originHost.value = res.data.origin_host;

    // 加载统计数据
    if (domain.value) {
      loadStats();
      loadWafRules();
      loadWafStats();
    }
  } catch {
    // 用户可能还没有注册域名
  } finally {
    loading.value = false;
  }
});

// WAF 相关状态
const wafRules = ref<WafRule[]>([]);
const wafStats = ref<WafStats | null>(null);
const wafLoading = ref(false);
const wafStatsLoading = ref(false);
const showAddRule = ref(false);
const editingRule = ref<WafRule | null>(null);

// 新规则表单
const newRule = ref<CreateWafRuleParams>({
  name: '',
  description: '',
  rule_type: 'sql_injection',
  pattern: '',
  action: 'block',
  priority: 100,
  is_enabled: true,
});

async function loadStats() {
  statsLoading.value = true;
  try {
    const res = await getDomainStats();
    stats.value = res.data;
  } catch {
    // 静默处理
  } finally {
    statsLoading.value = false;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '未知';
  return formatFullDate(dateStr);
}

function getVerifyStatusColor(status: string): string {
  switch (status) {
    case 'verified': return 'var(--color-success)';
    case 'failed': return 'var(--color-danger)';
    default: return 'var(--color-warning)';
  }
}

function getVerifyStatusText(status: string): string {
  switch (status) {
    case 'verified': return '已验证';
    case 'failed': return '验证失败';
    default: return '待验证';
  }
}

// 计算图表数据
const chartData = computed(() => {
  if (!stats.value?.trend?.last7Days) return [];

  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const data = stats.value.trend.last7Days;

  // 填充最近7天的数据
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = data.find(d => d.date === dateStr);
    result.push({
      day: days[date.getDay()],
      count: dayData?.count || 0,
      date: dateStr,
    });
  }

  return result;
});

const maxCount = computed(() => {
  return Math.max(...chartData.value.map(d => d.count), 1);
});

// WAF 函数
async function loadWafRules() {
  wafLoading.value = true;
  try {
    const res = await getWafRules();
    wafRules.value = res.data;
  } catch {
    // 静默处理
  } finally {
    wafLoading.value = false;
  }
}

async function loadWafStats() {
  wafStatsLoading.value = true;
  try {
    const res = await getWafStats();
    wafStats.value = res.data;
  } catch {
    // 静默处理
  } finally {
    wafStatsLoading.value = false;
  }
}

async function handleInitPresets() {
  try {
    await initPresetRules();
    await loadWafRules();
    await loadWafStats();
    successMsg.value = '预设规则初始化成功';
  } catch (e: any) {
    error.value = e?.data?.error?.message || '初始化失败';
  }
}

async function handleToggleRule(rule: WafRule) {
  try {
    await toggleWafRule(rule.id);
    rule.is_enabled = !rule.is_enabled;
    await loadWafStats();
  } catch (e: any) {
    error.value = e?.data?.error?.message || '操作失败';
  }
}

async function handleDeleteRule(rule: WafRule) {
  if (!confirm(`确定删除规则"${rule.name}"吗？`)) return;

  try {
    await deleteWafRule(rule.id);
    wafRules.value = wafRules.value.filter(r => r.id !== rule.id);
    await loadWafStats();
    successMsg.value = '规则删除成功';
  } catch (e: any) {
    error.value = e?.data?.error?.message || '删除失败';
  }
}

async function handleCreateRule() {
  error.value = '';

  if (!newRule.value.name || !newRule.value.pattern) {
    error.value = '请填写规则名称和匹配模式';
    return;
  }

  try {
    await createWafRule(newRule.value);
    await loadWafRules();
    await loadWafStats();
    showAddRule.value = false;
    resetNewRule();
    successMsg.value = '规则创建成功';
  } catch (e: any) {
    error.value = e?.data?.error?.message || '创建失败';
  }
}

function resetNewRule() {
  newRule.value = {
    name: '',
    description: '',
    rule_type: 'sql_injection',
    pattern: '',
    action: 'block',
    priority: 100,
    is_enabled: true,
  };
}

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
    activeTab.value = 'verify';
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

      <!-- 已注册域名时显示仪表盘 -->
      <template v-else>
        <!-- 标签页导航 -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'overview' }"
            @click="activeTab = 'overview'"
          >
            概览
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            设置
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'verify' }"
            @click="activeTab = 'verify'"
          >
            验证
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'waf' }"
            @click="activeTab = 'waf'"
          >
            <Icon name="shield" :size="16" />
            WAF防护
          </button>
        </div>

        <!-- 概览标签页 -->
        <template v-if="activeTab === 'overview'">
          <!-- 统计卡片 -->
          <div class="stats-grid stagger">
            <div class="stat-card">
              <div class="stat-icon"><Icon name="globe" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value">{{ auth.username }}.nomio.world</div>
                <div class="stat-label">域名</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon"><Icon name="check-circle" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value" :style="{ color: getVerifyStatusColor(domain?.verify_status || '') }">
                  {{ getVerifyStatusText(domain?.verify_status || '') }}
                </div>
                <div class="stat-label">验证状态</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon"><Icon name="mail" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.mail.total || 0 }}</div>
                <div class="stat-label">邮件数量</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon"><Icon name="database" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value">{{ formatBytes(stats?.mail.totalSize || 0) }}</div>
                <div class="stat-label">存储用量</div>
              </div>
            </div>
          </div>

          <!-- 域名信息卡片 -->
          <div class="card">
            <div class="card-title">域名信息</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">域名</div>
                <div class="info-value">
                  <a :href="`https://${auth.username}.nomio.world`" target="_blank" class="domain-link">
                    {{ auth.username }}.nomio.world
                  </a>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">源站地址</div>
                <div class="info-value">
                  <a :href="domain?.origin_url" target="_blank" class="origin-link">
                    {{ domain?.origin_url }}
                  </a>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">注册时间</div>
                <div class="info-value">{{ formatDate(domain?.created_at || null) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">域名年龄</div>
                <div class="info-value">{{ stats?.domain.ageDays || 0 }} 天</div>
              </div>
            </div>
          </div>

          <!-- 邮件趋势图表 -->
          <div class="card">
            <div class="card-title">最近7天邮件趋势</div>
            <div v-if="statsLoading" class="loading-container">
              <span class="spinner"></span>
            </div>
            <div v-else class="chart-container">
              <div class="chart">
                <div
                  v-for="(item, index) in chartData"
                  :key="index"
                  class="chart-bar-wrapper"
                >
                  <div class="chart-bar-value">{{ item.count }}</div>
                  <div
                    class="chart-bar"
                    :style="{ height: `${(item.count / maxCount) * 100}%` }"
                  ></div>
                  <div class="chart-bar-label">{{ item.day }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="card">
            <div class="card-title">快速操作</div>
            <div class="actions-grid">
              <button class="action-btn" @click="activeTab = 'settings'">
                <span class="action-icon"><Icon name="settings" :size="24" /></span>
                <span class="action-text">修改源站</span>
              </button>
              <button class="action-btn" @click="activeTab = 'verify'">
                <span class="action-icon"><Icon name="search" :size="24" /></span>
                <span class="action-text">验证源站</span>
              </button>
              <a
                :href="`https://${auth.username}.nomio.world`"
                target="_blank"
                class="action-btn"
              >
                <span class="action-icon"><Icon name="globe" :size="24" /></span>
                <span class="action-text">访问网站</span>
              </a>
            </div>
          </div>
        </template>

        <!-- 设置标签页 -->
        <template v-if="activeTab === 'settings'">
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
                <span v-else>保存配置</span>
              </button>
            </form>
          </div>
        </template>

        <!-- 验证标签页 -->
        <template v-if="activeTab === 'verify'">
          <div class="card">
            <div class="card-title">源站验证</div>
            <div class="verify-status">
              <div class="verify-icon" :style="{ color: getVerifyStatusColor(domain?.verify_status || '') }">
                {{ domain?.verify_status === 'verified' ? '✓' : '⏳' }}
              </div>
              <div class="verify-info">
                <div class="verify-text" :style="{ color: getVerifyStatusColor(domain?.verify_status || '') }">
                  {{ getVerifyStatusText(domain?.verify_status || '') }}
                </div>
                <div class="verify-desc">
                  {{ domain?.verify_status === 'verified' ? '你的源站已通过验证' : '请验证你的源站所有权' }}
                </div>
              </div>
            </div>

            <div v-if="domain?.verify_status !== 'verified'" class="verify-steps">
              <h3>验证步骤</h3>
              <div class="step-list">
                <div class="step">
                  <div class="step-num">1</div>
                  <div class="step-content">
                    <div class="step-title">创建验证文件</div>
                    <div class="step-desc">在你的源站创建以下文件：</div>
                    <div class="code-block">
                      <div class="code-label">文件路径</div>
                      <code>/.well-known/nomio-verify.txt</code>
                    </div>
                  </div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div class="step-content">
                    <div class="step-title">填写文件内容</div>
                    <div class="step-desc">文件内容为：</div>
                    <div class="code-block">
                      <div class="code-label">文件内容</div>
                      <code>nomio-verify={{ domain?.verify_status === 'verified' ? '***' : '(你的验证Token)' }}</code>
                    </div>
                  </div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div class="step-content">
                    <div class="step-title">点击验证</div>
                    <div class="step-desc">完成上述步骤后，点击下方按钮进行验证。</div>
                  </div>
                </div>
              </div>

              <button class="btn btn-primary" @click="handleVerify" :disabled="verifying">
                <span v-if="verifying" class="spinner"></span>
                <span v-else>验证源站</span>
              </button>
            </div>
          </div>
        </template>

        <!-- WAF防护标签页 -->
        <template v-if="activeTab === 'waf'">
          <!-- WAF统计卡片 -->
          <div class="stats-grid stagger">
            <div class="stat-card">
              <div class="stat-icon"><Icon name="shield" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value">{{ wafStats?.total_rules || 0 }}</div>
                <div class="stat-label">总规则数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><Icon name="check-circle" :size="24" /></div>
              <div class="stat-content">
                <div class="stat-value">{{ wafStats?.enabled_rules || 0 }}</div>
                <div class="stat-label">已启用</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🚫</div>
              <div class="stat-content">
                <div class="stat-value">{{ wafStats?.total_blocked || 0 }}</div>
                <div class="stat-label">总拦截</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-content">
                <div class="stat-value">{{ wafStats?.blocked_today || 0 }}</div>
                <div class="stat-label">今日拦截</div>
              </div>
            </div>
          </div>

          <!-- 操作栏 -->
          <div class="waf-toolbar">
            <div class="toolbar-left">
              <h3>WAF规则</h3>
              <span class="rule-count">{{ wafRules.length }} 条规则</span>
            </div>
            <div class="toolbar-right">
              <button
                v-if="wafRules.length === 0"
                class="btn btn-primary btn-sm"
                @click="handleInitPresets"
              >
                初始化预设规则
              </button>
              <button
                class="btn btn-outline btn-sm"
                @click="showAddRule = true"
              >
                添加规则
              </button>
            </div>
          </div>

          <!-- 规则列表 -->
          <div v-if="wafLoading" class="loading-overlay">
            <span class="spinner"></span>
          </div>

          <div v-else-if="wafRules.length === 0" class="empty-state card">
            <div class="empty-icon"><Icon name="shield" :size="48" /></div>
            <h3>暂无WAF规则</h3>
            <p>点击"初始化预设规则"快速开始</p>
          </div>

          <div v-else class="waf-rules-list">
            <div
              v-for="rule in wafRules"
              :key="rule.id"
              class="waf-rule-card"
              :class="{ disabled: !rule.is_enabled }"
            >
              <div class="rule-header">
                <div class="rule-info">
                  <span class="rule-icon">{{ WAF_RULE_TYPE_ICONS[rule.rule_type] || '🛡️' }}</span>
                  <div class="rule-title">
                    <h4>{{ rule.name }}</h4>
                    <span class="rule-type-badge" :style="{ background: WAF_ACTION_COLORS[rule.action as keyof typeof WAF_ACTION_COLORS] || 'var(--color-text-muted)' }">
                      {{ WAF_ACTION_LABELS[rule.action as keyof typeof WAF_ACTION_LABELS] || rule.action }}
                    </span>
                  </div>
                </div>
                <div class="rule-actions">
                  <button
                    class="toggle-btn"
                    :class="{ enabled: rule.is_enabled }"
                    @click="handleToggleRule(rule)"
                    :title="rule.is_enabled ? '点击禁用' : '点击启用'"
                  >
                    <span class="toggle-slider"></span>
                  </button>
                  <button
                    v-if="!rule.is_preset"
                    class="action-btn danger"
                    @click="handleDeleteRule(rule)"
                    title="删除规则"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="rule-body">
                <p v-if="rule.description" class="rule-desc">{{ rule.description }}</p>
                <div class="rule-meta">
                  <span class="meta-item">
                    <span class="meta-label">类型</span>
                    <span class="meta-value">{{ WAF_RULE_TYPE_LABELS[rule.rule_type as keyof typeof WAF_RULE_TYPE_LABELS] || rule.rule_type }}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-label">优先级</span>
                    <span class="meta-value">{{ rule.priority }}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-label">来源</span>
                    <span class="meta-value">{{ rule.is_preset ? '预设' : '自定义' }}</span>
                  </span>
                </div>
                <div class="rule-pattern">
                  <span class="pattern-label">匹配模式</span>
                  <code class="pattern-value">{{ rule.pattern }}</code>
                </div>
              </div>
            </div>
          </div>

          <!-- 添加规则弹窗 -->
          <div v-if="showAddRule" class="modal-overlay" @click.self="showAddRule = false">
            <div class="modal">
              <div class="modal-header">
                <h3>添加WAF规则</h3>
                <button class="close-btn" @click="showAddRule = false">×</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label>规则名称</label>
                  <input
                    v-model="newRule.name"
                    type="text"
                    placeholder="如：拦截恶意IP"
                    class="focus-ring"
                  />
                </div>
                <div class="form-group">
                  <label>规则描述（可选）</label>
                  <input
                    v-model="newRule.description"
                    type="text"
                    placeholder="规则的详细说明"
                    class="focus-ring"
                  />
                </div>
                <div class="form-group">
                  <label>规则类型</label>
                  <select v-model="newRule.rule_type" class="focus-ring">
                    <option v-for="(label, type) in WAF_RULE_TYPE_LABELS" :key="type" :value="type">
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>匹配模式</label>
                  <input
                    v-model="newRule.pattern"
                    type="text"
                    placeholder="IP地址、路径、正则表达式等"
                    class="focus-ring"
                  />
                  <div class="hint">根据规则类型填写相应的匹配模式</div>
                </div>
                <div class="form-group">
                  <label>执行动作</label>
                  <select v-model="newRule.action" class="focus-ring">
                    <option v-for="(label, action) in WAF_ACTION_LABELS" :key="action" :value="action">
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>优先级</label>
                  <input
                    v-model.number="newRule.priority"
                    type="number"
                    min="1"
                    max="1000"
                    class="focus-ring"
                  />
                  <div class="hint">数字越小优先级越高</div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline" @click="showAddRule = false">取消</button>
                <button class="btn btn-primary" @click="handleCreateRule">创建规则</button>
              </div>
            </div>
          </div>

          <!-- 最近日志 -->
          <div v-if="wafStats?.recent_logs && wafStats.recent_logs.length > 0" class="card">
            <div class="card-title">最近拦截日志</div>
            <div class="logs-list">
              <div
                v-for="log in wafStats.recent_logs"
                :key="log.id"
                class="log-item"
              >
                <div class="log-icon" :class="{ blocked: log.is_blocked }">
                  {{ log.is_blocked ? '✕' : '✎' }}
                </div>
                <div class="log-content">
                  <div class="log-title">
                    <span class="log-rule">{{ log.rule_name || '默认规则' }}</span>
                    <span class="log-time">{{ formatDateShort(log.created_at) }}</span>
                  </div>
                  <div class="log-details">
                    <span class="log-ip">{{ log.client_ip }}</span>
                    <span v-if="log.request_path" class="log-path">{{ log.request_path }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s var(--ease);
  animation: fadeInUp 0.5s var(--ease);
  animation-fill-mode: both;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-muted);
}

.stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  border-radius: var(--radius-lg);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--color-text);
  font-weight: 500;
}

.domain-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s var(--ease);
}

.domain-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.origin-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  word-break: break-all;
  transition: all 0.2s var(--ease);
}

.origin-link:hover {
  color: var(--color-primary);
}

/* 图表 */
.chart-container {
  padding: 20px 0;
}

.chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  gap: 12px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.chart-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-info) 100%);
  border-radius: var(--radius) var(--radius) 0 0;
  transition: height 0.5s var(--ease);
  min-height: 4px;
  position: relative;
}

.chart-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius) var(--radius) 0 0;
}

.chart-bar-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-top: 8px;
  font-weight: 500;
}

/* 操作按钮 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s var(--ease);
  text-decoration: none;
  color: var(--color-text);
}

.action-btn:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-muted);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.action-icon {
  font-size: 2rem;
}

.action-text {
  font-size: 0.875rem;
  font-weight: 600;
}

/* 验证状态 */
.verify-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.verify-icon {
  font-size: 2.5rem;
}

.verify-info {
  flex: 1;
}

.verify-text {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.verify-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* 验证步骤 */
.verify-steps {
  margin-top: 24px;
}

.verify-steps h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.step {
  display: flex;
  gap: 16px;
}

.step-num {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.step-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.code-block {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px;
  margin-top: 8px;
}

.code-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.code-block code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: var(--color-primary);
  word-break: break-all;
}

/* WAF 相关样式 */
.waf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-left h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.rule-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* WAF 规则列表 */
.waf-rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waf-rule-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.3s var(--ease);
  animation: fadeInUp 0.4s var(--ease);
  animation-fill-mode: both;
}

.waf-rule-card:nth-child(1) { animation-delay: 0.05s; }
.waf-rule-card:nth-child(2) { animation-delay: 0.1s; }
.waf-rule-card:nth-child(3) { animation-delay: 0.15s; }
.waf-rule-card:nth-child(4) { animation-delay: 0.2s; }
.waf-rule-card:nth-child(5) { animation-delay: 0.25s; }
.waf-rule-card:nth-child(6) { animation-delay: 0.3s; }

.waf-rule-card:hover {
  border-color: var(--color-primary-muted);
  box-shadow: var(--shadow-md);
}

.waf-rule-card.disabled {
  opacity: 0.6;
  background: var(--color-bg);
}

.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rule-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rule-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  border-radius: var(--radius);
}

.rule-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-title h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.rule-type-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 开关按钮 */
.toggle-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: var(--color-border);
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.toggle-btn.enabled {
  background: var(--color-primary);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease);
}

.toggle-btn.enabled .toggle-slider {
  transform: translateX(20px);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

.action-btn.danger:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: var(--color-danger-soft);
}

.rule-body {
  padding-left: 52px;
}

.rule-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.rule-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-size: 0.75rem;
  color: var(--color-text);
  font-weight: 500;
}

.rule-pattern {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
  padding: 10px 12px;
}

.pattern-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 4px;
}

.pattern-value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--color-primary);
  word-break: break-all;
  display: block;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s var(--ease);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: scaleIn 0.3s var(--ease-bounce);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg);
  border-radius: var(--radius);
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.close-btn:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-light);
}

/* 日志列表 */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius);
  transition: all 0.2s var(--ease);
}

.log-item:hover {
  background: var(--color-primary-soft);
}

.log-icon {
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: var(--radius);
  flex-shrink: 0;
}

.log-icon.blocked {
  background: var(--color-danger-soft);
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.log-rule {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.log-time {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.log-details {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.log-ip {
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.log-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .chart {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
