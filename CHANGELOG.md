# 更新日志 / Changelog

本项目遵循 [语义化版本](https://semver.org/) 规范。
This project follows [Semantic Versioning](https://semver.org/).

[English](#english) | [中文](#中文)

---

## 中文

### [1.0.0] - 2026-07-14

#### 新功能

- **用户认证系统**
  - 用户注册（用户名 + 密码 + 源站地址）
  - 用户登录（JWT Token 认证）
  - 密码安全存储（PBKDF2 + 随机 Salt）
  - 子域名校验（格式、长度、保留词）

- **二级域名分发**
  - Gateway Worker 反向代理
  - HTTPS 强制回源
  - Host 头重写
  - 安全头注入（X-Content-Type-Options, X-Frame-Options）
  - 超时控制（AbortController 10s）

- **邮箱托管**
  - Email Worker 邮件接收
  - 纯文本提取（HTML 转纯文本）
  - 邮件存储（D1 数据库）
  - 频率限制（5 分钟/3 封）
  - 存储配额（100MB/用户）
  - 自动清理（超出配额删除最早 10%）

- **用户控制台（Dashboard）**
  - 登录/注册页面
  - 仪表盘（统计概览）
  - 域名管理（源站配置 + 源站验证）
  - 邮箱管理（收件箱 + 分页 + 设置）

- **API 接口**（14 个）
  - `POST /api/auth/register` -- 用户注册
  - `POST /api/auth/login` -- 用户登录
  - `POST /api/auth/logout` -- 退出登录
  - `GET /api/auth/me` -- 获取用户信息
  - `GET /api/domains` -- 获取域名配置
  - `PUT /api/domains` -- 更新源站地址
  - `DELETE /api/domains` -- 删除域名
  - `POST /api/domains/verify` -- 源站验证
  - `GET /api/mails` -- 邮件列表（分页）
  - `GET /api/mails/:id` -- 邮件详情
  - `DELETE /api/mails/:id` -- 删除单封邮件
  - `DELETE /api/mails` -- 批量删除邮件
  - `GET /api/settings/email` -- 获取邮箱设置
  - `PUT /api/settings/email` -- 更新邮箱设置

#### 测试

- 193 项测试全部通过
- API Worker: 154 项（校验器、密码、响应、认证、域名、邮件、设置）
- Gateway Worker: 9 项（转发、超时、错误处理、安全头）
- Email Worker: 11 项（接收、拒绝、频率限制、配额清理）
- Dashboard: 19 项（API 客户端、状态管理）

#### 文档

- 技术文档（架构、API、数据模型、安全机制）
- README（中英文）
- 贡献指南（中英文）
- 行为准则
- 安全策略
- 更新日志

#### 工具链

- ESLint + Prettier 代码质量检查
- Vitest 测试框架
- GitHub Actions CI/CD
- 一键部署脚本（deploy.sh）

---

## English

### [1.0.0] - 2026-07-14

#### Features

- **User Authentication**
  - User registration (username + password + origin URL)
  - User login (JWT Token authentication)
  - Secure password storage (PBKDF2 + random Salt)
  - Subdomain validation (format, length, reserved words)

- **Subdomain Distribution**
  - Gateway Worker reverse proxy
  - Forced HTTPS origin
  - Host header rewriting
  - Security header injection (X-Content-Type-Options, X-Frame-Options)
  - Timeout control (AbortController 10s)

- **Email Hosting**
  - Email Worker reception
  - Plain text extraction (HTML to plain text)
  - Email storage (D1 database)
  - Rate limiting (5 min / 3 emails)
  - Storage quota (100MB/user)
  - Auto-cleanup (delete oldest 10% when quota exceeded)

- **User Dashboard**
  - Login/Register pages
  - Dashboard (statistics overview)
  - Domain management (origin config + verification)
  - Mailbox management (inbox + pagination + settings)

- **API Endpoints** (14 total)
  - Auth: register, login, logout, get profile
  - Domains: get, update, delete, verify
  - Mails: list (paginated), detail, delete, batch delete
  - Settings: get email settings, update email settings

#### Testing

- 193 tests all passing
- API Worker: 154 tests
- Gateway Worker: 9 tests
- Email Worker: 11 tests
- Dashboard: 19 tests

#### Documentation

- Technical documentation (architecture, API, data model, security)
- README (Chinese and English)
- Contributing guide (Chinese and English)
- Code of Conduct
- Security Policy
- Changelog

#### Tooling

- ESLint + Prettier code quality
- Vitest testing framework
- GitHub Actions CI/CD
- One-click deploy script (deploy.sh)
