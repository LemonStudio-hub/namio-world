/**
 * WAF 相关类型定义
 */

// WAF 规则类型
export type WafRuleType =
  | 'block_ip'         // 封禁IP
  | 'block_country'    // 封禁国家
  | 'block_path'       // 封禁路径
  | 'block_user_agent' // 封禁UA
  | 'rate_limit'       // 限速
  | 'geo_block'        // 地理位置封禁
  | 'custom_header'    // 自定义头部检查
  | 'sql_injection'    // SQL注入防护
  | 'xss_protection'   // XSS防护
  | 'bot_protection'   // 爬虫防护
  | 'ddos_protection'; // DDoS防护

// WAF 规则动作
export type WafAction = 'block' | 'challenge' | 'allow' | 'log';

// WAF 规则配置
export interface WafRuleConfig {
  // 限速配置
  rate_limit?: {
    requests: number;
    window_seconds: number;
  };
  // 地理位置配置
  geo_block?: {
    countries: string[];
  };
  // 自定义头部配置
  custom_header?: {
    header_name: string;
    header_value?: string;
    pattern?: string;
  };
  // SQL注入配置
  sql_injection?: {
    block_on_detect: boolean;
    log_only: boolean;
  };
  // XSS配置
  xss_protection?: {
    block_on_detect: boolean;
    sanitize_output: boolean;
  };
  // 爬虫防护配置
  bot_protection?: {
    allowed_bots: string[];
    challenge_unknown: boolean;
  };
  // DDoS防护配置
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
  config: WafRuleConfig | null;
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

// 预设规则定义
export interface PresetRule {
  name: string;
  description: string;
  rule_type: WafRuleType;
  pattern: string;
  action: WafAction;
  priority: number;
  config?: WafRuleConfig;
}
