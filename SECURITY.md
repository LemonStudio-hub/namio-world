# 安全策略 / Security Policy

[English](#english) | [中文](#中文)

---

## 中文

### 支持的版本

| 版本 | 支持状态 |
|------|----------|
| 1.0.x | 支持 |
| < 1.0 | 不支持 |

### 报告漏洞

如果你发现安全漏洞，请**不要**通过公开 Issue 报告。请通过以下方式联系我们：

**邮箱：** security@namio.world

**报告内容应包括：**
- 漏洞描述
- 复现步骤
- 影响范围
- 潜在风险
- 建议的修复方案（如有）

### 响应时间

- **确认收到：** 48 小时内
- **初步评估：** 7 个工作日内
- **修复发布：** 根据严重程度，30 天内

### 严重程度分类

| 级别 | 描述 | 响应时间 |
|------|------|----------|
| 严重 | 远程代码执行、数据泄露 | 24 小时 |
| 高 | 认证绕过、权限提升 | 72 小时 |
| 中 | XSS、CSRF、信息泄露 | 7 天 |
| 低 | 配置问题、低风险漏洞 | 30 天 |

### 安全最佳实践

部署本项目时，请确保：

1. **JWT_SECRET** 使用强随机密钥（至少 32 字节）
2. **wrangler.toml** 中的密钥不要提交到版本控制
3. 定期轮换 API Token
4. 启用 Cloudflare 的安全功能（WAF、DDoS 防护）
5. 监控异常请求和错误日志

### 已知安全机制

- 密码使用 PBKDF2 (SHA-256, 100k 迭代) + 随机 Salt 哈希存储
- JWT Token 使用 HS256 签名，有效期 7 天
- API 请求强制 CORS 策略
- 源站强制 HTTPS 回源
- 邮件频率限制（5 分钟/3 封）
- 存储配额限制（100MB/用户）

---

## English

### Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | Yes |
| < 1.0 | No |

### Reporting a Vulnerability

If you discover a security vulnerability, please **do NOT** report it through a public Issue. Contact us via:

**Email:** security@namio.world

**Report should include:**
- Vulnerability description
- Steps to reproduce
- Impact scope
- Potential risk
- Suggested fix (if any)

### Response Time

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 7 business days
- **Fix release:** Within 30 days depending on severity

### Severity Classification

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Remote code execution, data breach | 24 hours |
| High | Authentication bypass, privilege escalation | 72 hours |
| Medium | XSS, CSRF, information disclosure | 7 days |
| Low | Configuration issues, low-risk vulnerabilities | 30 days |

### Security Best Practices

When deploying this project, ensure:

1. **JWT_SECRET** uses a strong random key (at least 32 bytes)
2. Secrets in **wrangler.toml** are not committed to version control
3. Rotate API tokens regularly
4. Enable Cloudflare security features (WAF, DDoS protection)
5. Monitor abnormal requests and error logs

### Known Security Mechanisms

- Passwords stored with PBKDF2 (SHA-256, 100k iterations) + random Salt
- JWT tokens signed with HS256, 7-day expiration
- API requests enforced with CORS policy
- Forced HTTPS origin for proxy
- Email rate limiting (5 min / 3 emails)
- Storage quota (100MB/user)
