/**
 * 预设 WAF 规则
 */

import type { PresetRule } from '../types/waf';

export const PRESET_WAF_RULES: PresetRule[] = [
  // ==================== 安全防护类 ====================
  {
    name: 'SQL注入防护',
    description: '检测并拦截常见的SQL注入攻击，如UNION SELECT、OR 1=1等',
    rule_type: 'sql_injection',
    pattern: '(?i)(union\\s+select|or\\s+1\\s*=\\s*1|drop\\s+table|insert\\s+into|delete\\s+from|update\\s+.*\\s+set)',
    action: 'block',
    priority: 10,
    config: {
      sql_injection: {
        block_on_detect: true,
        log_only: false,
      },
    },
  },
  {
    name: 'XSS防护',
    description: '检测并拦截跨站脚本攻击，如script标签、事件处理器等',
    rule_type: 'xss_protection',
    pattern: '(?i)(<script[^>]*>|javascript:|on\\w+\\s*=|<iframe|<object|<embed)',
    action: 'block',
    priority: 20,
    config: {
      xss_protection: {
        block_on_detect: true,
        sanitize_output: true,
      },
    },
  },
  {
    name: '路径遍历防护',
    description: '检测并拦截路径遍历攻击，如../、..\\等',
    rule_type: 'block_path',
    pattern: '(\\.\\.[\\\\/]|\\.\\.%[0-9a-fA-F]{2})',
    action: 'block',
    priority: 30,
  },
  {
    name: '敏感文件访问防护',
    description: '阻止访问敏感文件，如.env、.git、wp-config.php等',
    rule_type: 'block_path',
    pattern: '^/(\\.env|\\.git|\\.svn|wp-config\\.php|config\\.php|database\\.yml)',
    action: 'block',
    priority: 40,
  },

  // ==================== 爬虫防护类 ====================
  {
    name: '恶意爬虫防护',
    description: '拦截已知的恶意爬虫和扫描器',
    rule_type: 'block_user_agent',
    pattern: '(?i)(sqlmap|nikto|nmap|masscan|zgrab|gobuster|dirbuster|wpscan|acunetix|nessus|openvas)',
    action: 'block',
    priority: 50,
  },
  {
    name: 'AI爬虫防护',
    description: '拦截AI训练爬虫，如GPTBot、ClaudeBot等',
    rule_type: 'bot_protection',
    pattern: '(?i)(GPTBot|ClaudeBot|anthropic-ai|ChatGPT-User|Google-Extended|FacebookBot)',
    action: 'block',
    priority: 55,
    config: {
      bot_protection: {
        allowed_bots: [],
        challenge_unknown: false,
      },
    },
  },
  {
    name: 'SEO爬虫限制',
    description: '限制SEO爬虫的访问频率',
    rule_type: 'rate_limit',
    pattern: '(?i)(AhrefsBot|SemrushBot|MJ12bot|DotBot|BLEXBot)',
    action: 'log',
    priority: 60,
    config: {
      rate_limit: {
        requests: 10,
        window_seconds: 60,
      },
    },
  },

  // ==================== DDoS防护类 ====================
  {
    name: '基础DDoS防护',
    description: '限制单IP的请求频率，防止DDoS攻击',
    rule_type: 'ddos_protection',
    pattern: '*',
    action: 'block',
    priority: 5,
    config: {
      ddos_protection: {
        threshold: 100,
        window_seconds: 60,
        block_duration: 300,
      },
    },
  },
  {
    name: 'API限速',
    description: '限制API接口的访问频率',
    rule_type: 'rate_limit',
    pattern: '^/api/',
    action: 'block',
    priority: 15,
    config: {
      rate_limit: {
        requests: 60,
        window_seconds: 60,
      },
    },
  },
  {
    name: '登录接口限速',
    description: '限制登录接口的访问频率，防止暴力破解',
    rule_type: 'rate_limit',
    pattern: '^/api/auth/login',
    action: 'block',
    priority: 12,
    config: {
      rate_limit: {
        requests: 5,
        window_seconds: 60,
      },
    },
  },

  // ==================== 地理位置类 ====================
  {
    name: '高风险国家封禁',
    description: '封禁来自高风险国家的访问（可自定义国家列表）',
    rule_type: 'geo_block',
    pattern: '*',
    action: 'block',
    priority: 70,
    config: {
      geo_block: {
        countries: ['KP', 'IR', 'SY', 'CU'], // 朝鲜、伊朗、叙利亚、古巴
      },
    },
  },

  // ==================== 请求方法类 ====================
  {
    name: 'HTTP方法限制',
    description: '只允许常见的HTTP方法，阻止TRACE、OPTIONS等',
    rule_type: 'block_path',
    pattern: '^(TRACE|OPTIONS|CONNECT)$',
    action: 'block',
    priority: 80,
  },

  // ==================== 头部检查类 ====================
  {
    name: '缺失Host头检查',
    description: '阻止缺失Host头的请求',
    rule_type: 'custom_header',
    pattern: 'Host',
    action: 'block',
    priority: 90,
    config: {
      custom_header: {
        header_name: 'Host',
      },
    },
  },
  {
    name: '可疑Referer检查',
    description: '检测并记录可疑的Referer来源',
    rule_type: 'custom_header',
    pattern: 'Referer',
    action: 'log',
    priority: 95,
    config: {
      custom_header: {
        header_name: 'Referer',
        pattern: '(?i)(casino|porn|viagra|pharmacy)',
      },
    },
  },
];

// WAF规则类型描述
export const WAF_RULE_TYPE_LABELS: Record<string, string> = {
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

// WAF动作描述
export const WAF_ACTION_LABELS: Record<string, string> = {
  block: '拦截',
  challenge: '挑战',
  allow: '放行',
  log: '仅记录',
};

// WAF动作颜色
export const WAF_ACTION_COLORS: Record<string, string> = {
  block: 'var(--color-danger)',
  challenge: 'var(--color-warning)',
  allow: 'var(--color-success)',
  log: 'var(--color-info)',
};
