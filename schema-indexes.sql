-- 添加索引
CREATE INDEX idx_mails_user_starred ON mails(user_id, is_starred);
CREATE INDEX idx_waf_rules_user_id ON waf_rules(user_id);
CREATE INDEX idx_waf_rules_type ON waf_rules(rule_type);
CREATE INDEX idx_waf_rules_enabled ON waf_rules(user_id, is_enabled);
CREATE INDEX idx_waf_logs_user_id ON waf_logs(user_id);
CREATE INDEX idx_waf_logs_created_at ON waf_logs(created_at);
CREATE INDEX idx_waf_logs_rule_id ON waf_logs(rule_id);
