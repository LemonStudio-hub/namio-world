-- Nomio.World 数据库增量更新脚本
-- 为已有数据库添加新字段和表

-- ============================================================
-- 用户表更新
-- ============================================================

-- 添加域名和邮箱状态字段
ALTER TABLE users ADD COLUMN has_domain BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN has_email BOOLEAN DEFAULT 0;

-- 添加SEO设置字段
ALTER TABLE users ADD COLUMN seo_enabled BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN seo_variant TEXT DEFAULT 'default';
ALTER TABLE users ADD COLUMN seo_custom_text TEXT;
ALTER TABLE users ADD COLUMN seo_custom_style TEXT;
ALTER TABLE users ADD COLUMN seo_position TEXT DEFAULT 'bottom-right';

-- ============================================================
-- 邮件表更新
-- ============================================================

-- 添加新字段
ALTER TABLE mails ADD COLUMN to_address TEXT;
ALTER TABLE mails ADD COLUMN html_body TEXT;
ALTER TABLE mails ADD COLUMN is_starred BOOLEAN DEFAULT 0;

-- ============================================================
-- WAF 规则表
-- ============================================================
CREATE TABLE waf_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL
    CHECK (rule_type IN ('block_ip', 'block_country', 'block_path', 'block_user_agent',
                         'rate_limit', 'geo_block', 'custom_header', 'sql_injection',
                         'xss_protection', 'bot_protection', 'ddos_protection')),
  pattern TEXT NOT NULL,
  action TEXT DEFAULT 'block'
    CHECK (action IN ('block', 'challenge', 'allow', 'log')),
  priority INTEGER DEFAULT 100,
  is_enabled BOOLEAN DEFAULT 1,
  is_preset BOOLEAN DEFAULT 0,
  config TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- WAF 日志表
-- ============================================================
CREATE TABLE waf_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  rule_id INTEGER,
  rule_name TEXT,
  action_taken TEXT NOT NULL,
  client_ip TEXT NOT NULL,
  request_path TEXT,
  request_method TEXT,
  user_agent TEXT,
  country_code TEXT,
  is_blocked BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
