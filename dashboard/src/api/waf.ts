/**
 * WAF 规则管理 API
 */

import request from './request';

// WAF 规则类型
export type WafRuleType =
  | 'block_ip'
  | 'block_country'
  | 'block_path'
  | 'block_user_agent'
  | 'rate_limit'
  | 'geo_block'
  | 'custom_header'
  | 'sql_injection'
  | 'xss_protection'
  | 'bot_protection'
  | 'ddos_protection';

// WAF 动作
export type WafAction = 'block' | 'challenge' | 'allow' | 'log';

// WAF 规则配置
export interface WafRuleConfig {
  rate_limit?: {
    requests: number;
    window_seconds: number;
  };
  geo_block?: {
    countries: string[];
  };
  custom_header?: {
    header_name: string;
    header_value?: string;
    pattern?: string;
  };
  sql_injection?: {
    block_on_detect: boolean;
    log_only: boolean;
  };
  xss_protection?: {
    block_on_detect: boolean;
    sanitize_output: boolean;
  };
  bot_protection?: {
    allowed_bots: string[];
    challenge_unknown: boolean;
  };
  ddos_protection?: {
    threshold: number;
    window_seconds: number;
    block_duration: number;
  };
}

// WAF 规则
export interface WafRule {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  rule_type: WafRuleType;
  pattern: string;
  action: WafAction;
  priority: number;
  is_enabled: boolean;
  is_preset: boolean;
  config: string | null;
  created_at: string;
  updated_at: string;
}

// 创建WAF规则参数
export interface CreateWafRuleParams {
  name: string;
  description?: string;
  rule_type: WafRuleType;
  pattern: string;
  action?: WafAction;
  priority?: number;
  is_enabled?: boolean;
  config?: WafRuleConfig;
}

// 更新WAF规则参数
export interface UpdateWafRuleParams {
  name?: string;
  description?: string;
  pattern?: string;
  action?: WafAction;
  priority?: number;
  is_enabled?: boolean;
  config?: WafRuleConfig;
}

// WAF 日志
export interface WafLog {
  id: number;
  user_id: number;
  rule_id: number | null;
  rule_name: string | null;
  action_taken: string;
  client_ip: string;
  request_path: string | null;
  request_method: string | null;
  user_agent: string | null;
  country_code: string | null;
  is_blocked: boolean;
  created_at: string;
}

// WAF 统计
export interface WafStats {
  total_rules: number;
  enabled_rules: number;
  preset_rules: number;
  custom_rules: number;
  total_blocked: number;
  blocked_today: number;
  blocked_by_type: Array<{
    rule_type: string;
    count: number;
  }>;
  recent_logs: WafLog[];
}

// API 函数
export async function getWafRules() {
  return request<WafRule[]>('/waf/rules');
}

export async function getWafRule(id: number) {
  return request<WafRule>(`/waf/rules/${id}`);
}

export async function createWafRule(params: CreateWafRuleParams) {
  return request<{ id: number; message: string }>('/waf/rules', {
    method: 'POST',
    body: params,
  });
}

export async function updateWafRule(id: number, params: UpdateWafRuleParams) {
  return request<{ message: string }>(`/waf/rules/${id}`, {
    method: 'PUT',
    body: params,
  });
}

export async function deleteWafRule(id: number) {
  return request<{ message: string }>(`/waf/rules/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleWafRule(id: number) {
  return request<{ id: number; is_enabled: boolean; message: string }>(`/waf/rules/${id}/toggle`, {
    method: 'PUT',
  });
}

export async function initPresetRules() {
  return request<{ message: string; count: number }>('/waf/rules/preset', {
    method: 'POST',
  });
}

export async function getWafStats() {
  return request<WafStats>('/waf/stats');
}

export async function getWafLogs(page = 1, limit = 20) {
  return request<{
    logs: WafLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/waf/logs?page=${page}&limit=${limit}`);
}

export async function clearWafLogs() {
  return request<{ message: string }>('/waf/logs', {
    method: 'DELETE',
  });
}

// 规则类型标签
export const WAF_RULE_TYPE_LABELS: Record<WafRuleType, string> = {
  block_ip: 'IP封禁',
  block_country: '国家封禁',
  block_path: '路径封禁',
  block_user_agent: 'UA封禁',
  rate_limit: '频率限制',
  geo_block: '地理位置封禁',
  custom_header: '自定义头部',
  sql_injection: 'SQL注入防护',
  xss_protection: 'XSS防护',
  bot_protection: '爬虫防护',
  ddos_protection: 'DDoS防护',
};

// 动作标签
export const WAF_ACTION_LABELS: Record<WafAction, string> = {
  block: '拦截',
  challenge: '挑战',
  allow: '放行',
  log: '仅记录',
};

// 动作颜色
export const WAF_ACTION_COLORS: Record<WafAction, string> = {
  block: 'var(--color-danger)',
  challenge: 'var(--color-warning)',
  allow: 'var(--color-success)',
  log: 'var(--color-info)',
};

// 规则类型图标
export const WAF_RULE_TYPE_ICONS: Record<WafRuleType, string> = {
  block_ip: '🚫',
  block_country: '🌍',
  block_path: '📁',
  block_user_agent: '🤖',
  rate_limit: '⏱️',
  geo_block: '🗺️',
  custom_header: '📋',
  sql_injection: '💉',
  xss_protection: '🛡️',
  bot_protection: '🕷️',
  ddos_protection: '⚔️',
};
