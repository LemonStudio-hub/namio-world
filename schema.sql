-- Namio.World D1 Database Schema
-- 数据库初始化脚本

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,              -- 子域名前缀，如 'alice'
  password_hash TEXT NOT NULL,                -- PBKDF2 加密存储 (salt:hash)
  origin_url TEXT NOT NULL,                   -- 源站 HTTPS URL
  origin_host TEXT NOT NULL,                  -- 回源 Host 头
  forward_email TEXT,                         -- 外部转发邮箱（可选）
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
  subject TEXT NOT NULL,
  body TEXT,                                   -- 纯文本正文
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  size INTEGER DEFAULT 0,                      -- 邮件大小（字节）
  is_read BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mails_user_id ON mails(user_id);
CREATE INDEX IF NOT EXISTS idx_mails_received_at ON mails(received_at);
CREATE INDEX IF NOT EXISTS idx_mails_message_id ON mails(message_id);
CREATE INDEX IF NOT EXISTS idx_mails_user_read ON mails(user_id, is_read);
