-- Nomio.World D1 Database Schema
-- 数据库初始化脚本

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,              -- 子域名前缀，如 'alice'
  password_hash TEXT NOT NULL,                -- PBKDF2 加密存储 (salt:hash)
  origin_url TEXT,                            -- 源站 HTTPS URL
  origin_host TEXT,                           -- 回源 Host 头
  has_domain BOOLEAN DEFAULT 0,               -- 是否已注册域名
  has_email BOOLEAN DEFAULT 0,                -- 是否已注册邮箱
  email_enabled BOOLEAN DEFAULT 1,            -- 邮箱功能是否启用
  status TEXT DEFAULT 'active'                -- active | frozen | deleted
    CHECK (status IN ('active', 'frozen', 'deleted')),
  verify_token TEXT,                          -- 源站验证 Token
  verify_status TEXT DEFAULT 'pending'        -- pending | verified | failed
    CHECK (verify_status IN ('pending', 'verified', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  total_mail_size INTEGER DEFAULT 0           -- 当前邮件总大小（字节）
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users(verify_token);

-- ============================================================
-- 邮件表
-- ============================================================
CREATE TABLE IF NOT EXISTS mails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message_id TEXT,                             -- 邮件 Message-ID（用于去重）
  from_address TEXT NOT NULL,
  to_address TEXT,                             -- 收件人地址
  subject TEXT NOT NULL,
  body TEXT,                                   -- 纯文本正文
  html_body TEXT,                              -- HTML 正文
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  size INTEGER DEFAULT 0,                      -- 邮件大小（字节）
  is_read BOOLEAN DEFAULT 0,
  is_starred BOOLEAN DEFAULT 0,                -- 是否星标
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mails_user_id ON mails(user_id);
CREATE INDEX IF NOT EXISTS idx_mails_received_at ON mails(received_at);
CREATE INDEX IF NOT EXISTS idx_mails_message_id ON mails(message_id);
CREATE INDEX IF NOT EXISTS idx_mails_user_read ON mails(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mails_user_starred ON mails(user_id, is_starred);

-- ============================================================
-- WAF 规则表
-- ============================================================
CREATE TABLE IF NOT EXISTS waf_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,                            -- 规则名称
  description TEXT,                              -- 规则描述
  rule_type TEXT NOT NULL                        -- 规则类型
    CHECK (rule_type IN ('block_ip', 'block_country', 'block_path', 'block_user_agent',
                         'rate_limit', 'geo_block', 'custom_header', 'sql_injection',
                         'xss_protection', 'bot_protection', 'ddos_protection')),
  pattern TEXT NOT NULL,                         -- 匹配模式（IP、路径、正则等）
  action TEXT DEFAULT 'block'                    -- 执行动作
    CHECK (action IN ('block', 'challenge', 'allow', 'log')),
  priority INTEGER DEFAULT 100,                  -- 优先级（数字越小优先级越高）
  is_enabled BOOLEAN DEFAULT 1,                  -- 是否启用
  is_preset BOOLEAN DEFAULT 0,                   -- 是否预设规则
  config TEXT,                                   -- JSON 配置（如限速参数）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_waf_rules_user_id ON waf_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_waf_rules_type ON waf_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_waf_rules_enabled ON waf_rules(user_id, is_enabled);

-- ============================================================
-- WAF 日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS waf_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  rule_id INTEGER,                               -- 触发的规则ID（NULL表示默认规则）
  rule_name TEXT,                                -- 规则名称
  action_taken TEXT NOT NULL,                    -- 执行的动作
  client_ip TEXT NOT NULL,                       -- 客户端IP
  request_path TEXT,                             -- 请求路径
  request_method TEXT,                           -- 请求方法
  user_agent TEXT,                               -- User-Agent
  country_code TEXT,                             -- 国家代码
  is_blocked BOOLEAN DEFAULT 1,                  -- 是否被拦截
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_waf_logs_user_id ON waf_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_waf_logs_created_at ON waf_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_waf_logs_rule_id ON waf_logs(rule_id);
