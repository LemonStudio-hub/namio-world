# Nomio.World 项目技术文档

**项目名称：** Nomio.World
**文档版本：** v1.2
**更新日期：** 2026 年 7 月 14 日

---

## 一、项目概述

### 1.1 项目定位

Nomio.World 是一个基于 Cloudflare 边缘计算平台的公益数字身份基建服务，为用户提供两大核心能力：

- **二级域名分发：** 用户可免费申请 `username.nomio.world` 格式的二级域名，通过 Worker 网关反向代理到用户自托管的 HTTPS 源站。
- **邮箱托管服务：** 每个用户自动获得 `username@nomio.world` 邮箱地址，支持纯文本邮件接收与存储，暂不支持邮件发送和附件。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 零运维 | 全栈托管于 Cloudflare，无需管理服务器 |
| 边缘优先 | 路由、邮件处理、数据读写均在边缘节点完成 |
| 安全默认 | 强制 HTTPS 回源，拒绝 HTTP 明文传输 |
| 成本可控 | 充分利用 Cloudflare 免费额度，按请求量弹性扩展 |

### 1.3 品牌释义

Nomio 为生造词，取自 **Name + I/O**（名称的输入与输出），寓意"域名与邮箱的入口服务"。`.world` 后缀强调全球接入属性。

---

## 二、技术架构概览

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         终端用户                                │
│    访问 https://username.nomio.world 或 发送邮件至             │
│              username@nomio.world                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare 边缘网络                          │
├─────────────────────────────────────────────────────────────────┤
│  DNS: *.nomio.world (泛域名, 橙色云开启)                       │
│  Email Routing: *@nomio.world → Email Worker                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Gateway Worker  │  │  Email Worker   │  │  Dashboard UI   │ │
│  │ (Hono 反代网关)  │  │ (邮件接收处理)  │  │ (Vue 3 前端)    │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                        ┌───────▼───────┐                        │
│                        │  D1 Database  │                        │
│                        │ (用户/邮件存储)│                        │
│                        └───────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     用户自托管源站                              │
│         (Vercel / Netlify / 自有服务器, 须支持 HTTPS)          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 请求流转时序

```
用户浏览器                    Cloudflare 边缘                     用户源站
    │                              │                                 │
    │  GET alice.nomio.world       │                                 │
    │─────────────────────────────>│                                 │
    │                              │  1. DNS 解析 *.nomio.world      │
    │                              │  2. 匹配 Worker 路由            │
    │                              │  3. 查询 D1 获取源站地址        │
    │                              │                                 │
    │                              │  GET / (Host: user-origin.com)  │
    │                              │────────────────────────────────>│
    │                              │                                 │
    │                              │  HTTP 200 (页面内容)            │
    │                              │<────────────────────────────────│
    │                              │                                 │
    │  HTTP 200 (页面内容)         │                                 │
    │<─────────────────────────────│                                 │
```

### 2.3 技术栈

| 组件 | 技术选型 | 用途 |
|------|----------|------|
| DNS 解析 | Cloudflare DNS | 泛域名解析、MX 记录 |
| 边缘计算 | Cloudflare Workers | 运行时环境 |
| 后端框架 | **Hono** | 路由、中间件、API 服务 |
| 后端语言 | **TypeScript** | 类型安全的后端开发 |
| 数据库 | Cloudflare D1 (SQLite) | 用户信息、邮件存储 |
| 邮件路由 | Cloudflare Email Routing | 入站邮件转发至 Worker |
| 邮件解析 | PostalMime | MIME 格式解析 |
| 前端框架 | **Vue 3** + TypeScript | 用户控制台 Dashboard |
| 构建工具 | **Vite** | 前端构建与开发服务器 |
| 状态管理 | Pinia | Vue 3 官方状态管理库 |
| HTTP 客户端 | ofetch | 前端 API 请求封装 |
| 认证方式 | JWT (HS256) | 用户登录态管理（Hono 内置中间件） |
| 静态托管 | Cloudflare Pages | Dashboard 前端部署 |

**为什么选择 Hono：**

- **轻量高效：** 核心包仅 ~14KB，适合 Workers 的 CPU 时间限制
- **边缘优先：** 原生支持 Cloudflare Workers，无冷启动开销
- **TypeScript 原生：** 完整的类型推导，减少运行时错误
- **内置中间件：** JWT 认证、CORS、速率限制等开箱即用
- **Web Standard API：** 基于标准 `Request`/`Response`，无私有锁定

### 2.4 Cloudflare 平台限制

在设计阶段需关注以下平台约束：

| 资源 | 免费版限制 | 付费版限制 | 备注 |
|------|-----------|-----------|------|
| Worker CPU 时间 | 10ms / 请求 | 50ms / 请求 | 超时将返回 1102 错误 |
| Worker 内存 | 128MB | 128MB | 单次请求可用内存上限 |
| Worker 请求速率 | 100,000 次/天 | 无限制 | 超出后返回 429 |
| D1 数据库大小 | 5GB | 50GB | 含所有表数据与索引 |
| D1 读取行数 | 500 万行/天 | 250 亿行/天 | 按实际扫描行数计 |
| D1 写入行数 | 10 万行/天 | 5000 万行/天 | INSERT/UPDATE/DELETE |
| D1 单次查询 | 100 万行 | 100 万行 | 结果集上限 |
| Email Routing 地址 | 200 个 | 200 个 | Catch-all 不受此限 |
| 单封邮件大小 | 25MB | 25MB | Cloudflare 硬限制 |
| KV 读取 | 10 万次/天 | 无限 | 可选缓存层 |
| KV 写入 | 1,000 次/天 | 无限 | 可选缓存层 |
| Pages 构建 | 500 次/月 | 5,000 次/月 | Dashboard 部署 |

> **设计启示：** Worker CPU 时间仅 10ms（免费版），回源请求的网络 I/O 不计入 CPU 时间，但响应体的流式处理会计入。建议对大型响应采用流式透传，避免在 Worker 中缓存完整响应体。

---

## 三、核心功能模块

### 3.1 二级域名分发系统（Gateway Worker）

#### 3.1.1 DNS 配置

在 Cloudflare DNS 中配置泛域名解析记录：

| 记录类型 | 名称 | 内容 | 代理状态 |
|----------|------|------|----------|
| A | `*.nomio.world` | `192.0.2.1`（占位） | 橙色云（Proxied） |
| AAAA | `*.nomio.world` | `100::`（占位） | 橙色云（Proxied） |
| MX | `nomio.world` | `route.mx.cloudflare.net` | DNS only |

> 开启橙色云后，A/AAAA 记录的实际 IP 由 Cloudflare 接管，占位地址仅用于激活代理。MX 记录用于 Email Routing，必须设为 DNS only。

#### 3.1.2 Worker 路由绑定

在 Worker 的 Triggers 设置中，添加路由规则：

- **路由模式：** `*.nomio.world/*`
- **执行方式：** 所有匹配请求交由 Worker 处理

#### 3.1.3 子域名校验

用户注册时，子域名需通过以下校验规则：

```typescript
// utils/validator.ts

const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'email', 'api', 'admin', 'dashboard',
  'app', 'cdn', 'static', 'assets', 'blog', 'docs',
  'support', 'help', 'status', 'staging', 'dev', 'test',
  'root', 'noreply', 'postmaster', 'abuse', 'security',
]);

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSubdomain(subdomain: string): ValidationResult {
  // 长度校验：1-63 字符（DNS 标签限制）
  if (subdomain.length < 1 || subdomain.length > 63) {
    return { valid: false, error: '用户名长度须为 1-63 个字符' };
  }
  // 格式校验：仅允许小写字母、数字、连字符
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return { valid: false, error: '仅允许小写字母、数字和连字符，且不能以连字符开头或结尾' };
  }
  // 保留词校验
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { valid: false, error: '该用户名为系统保留，不可注册' };
  }
  return { valid: true };
}
```

#### 3.1.4 核心转发逻辑（Hono 实现）

```typescript
// workers/gateway/src/index.ts
import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// 通配路由：处理所有子域名请求
app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname;
  const subdomain = hostname.split('.')[0];

  // 1. 基本格式校验
  if (!subdomain || subdomain.length > 63) {
    return c.text('无效的域名', 400);
  }

  // 2. 从 D1 查询用户配置
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ? AND status = ?'
  ).bind(subdomain, 'active').first<{ origin_url: string; origin_host: string }>();

  if (!user) {
    return c.text('域名未注册或已停用', 404);
  }

  // 3. 强制 HTTPS 回源校验
  if (!user.origin_url.startsWith('https://')) {
    return c.text('源站配置错误：必须使用 HTTPS', 502);
  }

  // 4. 构造回源请求
  const originUrl = new URL(user.origin_url);
  const targetUrl = `${originUrl.origin}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set('Host', user.origin_host || originUrl.hostname);
  headers.set('X-Forwarded-For', c.req.header('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Real-IP', c.req.header('CF-Connecting-IP') || '');

  // 5. 发起回源请求（AbortController 控制超时）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    // 6. 透传响应，注入安全头
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return c.text('源站响应超时', 504);
    }
    return c.text('源站连接失败', 502);
  }
});

export default app;
```

#### 3.1.5 关键设计决策

| 决策点 | 方案 | 理由 |
|--------|------|------|
| 回源协议 | 仅支持 HTTPS | 杜绝混合内容风险，强制用户源站合规 |
| Host 头重写 | 替换为用户源站域名 | 避免源站因 `server_name` 不匹配返回默认站点 |
| 超时控制 | AbortController 10s | 防止单个慢源站拖垮 Worker CPU 时间配额 |
| 缓存策略 | 不缓存 | 用户源站内容动态更新，实时透传 |
| 重定向处理 | `redirect: 'follow'` | 自动跟随源站 301/302，对用户透明 |
| 安全头注入 | 响应添加 nosniff 等 | 防止 MIME 类型嗅探攻击 |

### 3.2 邮箱托管系统（Email Worker）

#### 3.2.1 邮件路由配置

在 Cloudflare Email Routing 中配置 Catch-all 规则：

| 配置项 | 值 |
|--------|-----|
| 自定义地址 | `*@nomio.world` |
| 目标类型 | Send to a Worker |
| 目标 Worker | Email Worker |

所有发送至 `@nomio.world` 的邮件，均以 HTTP 请求形式转发给 Email Worker 处理。

#### 3.2.2 邮件接收与处理流程

> Email Worker 使用 `email()` 事件处理器，不经过 Hono 路由，直接由 Cloudflare 调度。

```typescript
// workers/email/src/index.ts
import PostalMime from 'postal-mime';

interface Env {
  DB: D1Database;
  MAX_MAIL_SIZE?: string;
  RATE_LIMIT_COUNT?: string;
  RATE_LIMIT_WINDOW?: string;
}

interface ParsedMail {
  messageId?: string;
  from?: { address: string };
  subject?: string;
  text?: string;
  html?: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    // 1. 解析收件人，提取用户名
    const recipient = message.to[0];
    if (!recipient) {
      message.setReject('No recipient');
      return;
    }

    const username = recipient.split('@')[0].toLowerCase();

    // 2. 基本格式校验
    if (!username || username.length > 63) {
      message.setReject('Invalid recipient');
      return;
    }

    // 3. 验证用户是否存在且状态正常
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ? AND status = ? AND email_enabled = 1'
    ).bind(username, 'active').first<{ id: number; total_mail_size: number; forward_email: string | null }>();

    if (!user) {
      message.setReject('User not found');
      return;
    }

    // 4. 检查用户邮箱配额（按总大小限制）
    if (user.total_mail_size >= 100 * 1024 * 1024) {
      await cleanupOldestMails(env.DB, user.id, 0.1);
    }

    // 5. 解析邮件
    const parser = new PostalMime();
    const parsed = (await parser.parse(message.raw)) as ParsedMail;

    // 6. 提取纯文本内容（剥离 HTML 标签与附件）
    const plainText = extractPlainText(parsed.text, parsed.html);

    // 7. 检查单封邮件大小
    const maxSize = parseInt(env.MAX_MAIL_SIZE || '5242880', 10);
    if (plainText.length > maxSize) {
      message.setReject('Message too large');
      return;
    }

    // 8. 频率限制：同一发件人 5 分钟内最多 N 封
    const rateLimit = parseInt(env.RATE_LIMIT_COUNT || '3', 10);
    const rateWindow = parseInt(env.RATE_LIMIT_WINDOW || '300', 10);
    const fromAddress = parsed.from?.address || message.from;

    const isRateLimited = await checkRateLimit(env.DB, user.id, fromAddress, rateLimit, rateWindow);
    if (isRateLimited) {
      return; // 静默丢弃，返回 250
    }

    // 9. 存储到 D1
    const mailSize = new TextEncoder().encode(plainText).length;
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO mails (user_id, message_id, from_address, subject, body, size) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        user.id,
        parsed.messageId || crypto.randomUUID(),
        fromAddress,
        parsed.subject || '(无主题)',
        plainText,
        mailSize
      ),
      env.DB.prepare(
        'UPDATE users SET total_mail_size = total_mail_size + ? WHERE id = ?'
      ).bind(mailSize, user.id),
    ]);

    // 10. 转发至用户配置的外部邮箱
    if (user.forward_email) {
      await forwardToExternal(user.forward_email, parsed, env);
    }
  },
};

// --- 辅助函数 ---

function extractPlainText(text?: string, html?: string): string {
  if (text) return text.trim();
  if (html) {
    let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  }
  return '';
}

async function checkRateLimit(
  db: D1Database,
  userId: number,
  fromAddress: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const result = await db.prepare(
    'SELECT COUNT(*) as cnt FROM mails WHERE user_id = ? AND from_address = ? AND received_at > ?'
  ).bind(userId, fromAddress, windowStart).first<{ cnt: number }>();
  return (result?.cnt ?? 0) >= limit;
}

async function cleanupOldestMails(db: D1Database, userId: number, ratio: number): Promise<void> {
  const count = await db.prepare(
    'SELECT COUNT(*) as cnt FROM mails WHERE user_id = ?'
  ).bind(userId).first<{ cnt: number }>();

  const deleteCount = Math.ceil((count?.cnt ?? 0) * ratio);
  if (deleteCount === 0) return;

  await db.prepare(
    'DELETE FROM mails WHERE id IN (SELECT id FROM mails WHERE user_id = ? ORDER BY received_at ASC LIMIT ?)'
  ).bind(userId, deleteCount).run();

  await db.prepare(
    'UPDATE users SET total_mail_size = (SELECT COALESCE(SUM(size), 0) FROM mails WHERE user_id = ?) WHERE id = ?'
  ).bind(userId, userId).run();
}

async function forwardToExternal(
  targetEmail: string,
  parsed: ParsedMail,
  env: Env,
): Promise<void> {
  // 转发需对接第三方邮件 API（如 SendGrid），当前版本暂未实现
  // 预留接口，未来扩展用
  console.log(`Forward to ${targetEmail}: ${parsed.subject}`);
}
```

#### 3.2.3 邮件过滤策略（防滥用）

| 策略 | 阈值 | 处理方式 |
|------|------|----------|
| 邮件大小 | > 5MB | 直接拒收（SMTP 550） |
| 单封邮件收件人数 | > 1 个 `@nomio.world` 用户 | 仅投递第一个，忽略其余 |
| 同一发件人频率 | 5 分钟内 > 3 封/同一用户 | 静默丢弃（返回 250，不存库） |
| 用户存储配额 | 100MB / 用户 | 超出后自动删除最早的 10% 邮件 |
| 用户不活跃 | 连续 90 天未登录 | 冻结邮箱（停止收信） |
| 冻结后宽限期 | 30 天 | 仍不登录则删除所有数据，释放用户名 |

#### 3.2.4 仅接收、不发送的设计

当前版本仅支持邮件接收，不提供 SMTP 发信服务。原因如下：

- **反垃圾邮件：** 自建 SMTP 若被滥用，`nomio.world` 域名将被全球邮件服务商拉黑，连带影响网页服务信誉。
- **合规简化：** 不存储用户发送的邮件，降低数据合规压力。
- **成本控制：** 发信需对接第三方 API（如 SendGrid）或自建 SMTP 服务器，增加运维成本。

> 用户如需用 `@nomio.world` 地址回复邮件，可在第三方邮箱客户端（如 Gmail）中设置"以该地址代发"，但平台不承担因此产生的域名信誉风险。

### 3.3 用户控制台（Dashboard）

#### 3.3.1 用户注册与认证流程

```
用户                    Dashboard (Vue 3)             API Worker (Hono)            D1
 │                         │                              │                        │
 │  访问注册页面           │                              │                        │
 │────────────────────────>│                              │                        │
 │                         │                              │                        │
 │  填写用户名+密码+源站   │                              │                        │
 │────────────────────────>│                              │                        │
 │                         │  POST /api/auth/register     │                        │
 │                         │─────────────────────────────>│                        │
 │                         │                              │  验证子域名合法性       │
 │                         │                              │  检查用户名是否已存在   │
 │                         │                              │───────────────────────>│
 │                         │                              │                        │
 │                         │                              │  INSERT INTO users     │
 │                         │                              │───────────────────────>│
 │                         │                              │                        │
 │                         │  返回 JWT Token              │                        │
 │                         │<─────────────────────────────│                        │
 │  存储 Token 到 Cookie   │                              │                        │
 │<────────────────────────│                              │                        │
```

**认证机制：**

- 使用 JWT (HS256) 签发登录令牌，有效期 7 天
- Token 存储于 `HttpOnly` + `Secure` + `SameSite=Strict` 的 Cookie 中
- API 请求通过 `Authorization: Bearer <token>` 头携带令牌
- 使用 Hono 内置 `jwt` 中间件自动验证与签发

#### 3.3.2 API 接口设计（Hono 路由）

所有 API 以 `/api/` 为前缀，返回 JSON 格式响应。

**路由注册示例：**

```typescript
// workers/api/src/index.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { domainRoutes } from './routes/domains';
import { mailRoutes } from './routes/mails';
import { settingsRoutes } from './routes/settings';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const app = new Hono<{ Bindings: Env }>();

// 全局中间件：CORS
app.use('/api/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// 全局中间件：统一错误处理
app.onError((err, c) => {
  console.error(err);
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
    500
  );
});

// 公开路由（无需认证）
app.route('/api/auth', authRoutes);

// 受保护路由（JWT 认证）
app.use('/api/domains/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/mails/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});
app.use('/api/settings/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

app.route('/api/domains', domainRoutes);
app.route('/api/mails', mailRoutes);
app.route('/api/settings', settingsRoutes);

// 404 兜底
app.notFound((c) => {
  return c.json(
    { success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } },
    404
  );
});

export default app;
```

**各路由模块示例：**

```typescript
// workers/api/src/routes/auth.ts
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { validateSubdomain } from '../utils/validator';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  const body = await c.req.json<{ username: string; password: string; originUrl: string }>();
  const { username, password, originUrl } = body;

  // 校验子域名
  const validation = validateSubdomain(username);
  if (!validation.valid) {
    return c.json(
      { success: false, error: { code: 'INVALID_INPUT', message: validation.error! } },
      400
    );
  }

  // 校验源站 URL
  if (!originUrl.startsWith('https://')) {
    return c.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '源站必须使用 HTTPS' } },
      400
    );
  }

  // 检查用户名是否已存在
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ?'
  ).bind(username).first();

  if (existing) {
    return c.json(
      { success: false, error: { code: 'USERNAME_TAKEN', message: '该用户名已被注册' } },
      409
    );
  }

  // 哈希密码（使用 Web Crypto API）
  const passwordHash = await hashPassword(password);

  // 插入用户
  await c.env.DB.prepare(
    'INSERT INTO users (username, password_hash, origin_url, origin_host) VALUES (?, ?, ?, ?)'
  ).bind(username, passwordHash, originUrl, new URL(originUrl).hostname).run();

  // 签发 JWT
  const token = await sign(
    { sub: username, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  return c.json({ success: true, data: { token } });
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first<{ id: number; password_hash: string; status: string }>();

  if (!user || user.status === 'deleted') {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '用户名或密码错误' } },
      401
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '用户名或密码错误' } },
      401
    );
  }

  // 更新最后登录时间
  await c.env.DB.prepare(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?'
  ).bind('active', user.id).run();

  const token = await sign(
    { sub: username, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
    c.env.JWT_SECRET,
  );

  return c.json({ success: true, data: { token } });
});

// GET /api/auth/me（需要 JWT 中间件，挂载在父路由）
authRoutes.get('/me', async (c) => {
  // JWT payload 通过 c.get('jwtPayload') 获取
  const payload = c.get('jwtPayload') as { sub: string };
  const user = await c.env.DB.prepare(
    'SELECT username, origin_url, forward_email, email_enabled, status, created_at FROM users WHERE username = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
      404
    );
  }

  return c.json({ success: true, data: user });
});

// --- 密码工具函数 ---

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  const hashArray = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex!.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  const hashArray = new Uint8Array(bits);
  const computedHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === hashHex;
}
```

**API 接口总览：**

**认证相关（公开）：**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 退出登录 | 是 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

**域名管理（需认证）：**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/domains` | 获取用户的域名配置 | 是 |
| PUT | `/api/domains` | 更新源站地址 | 是 |
| DELETE | `/api/domains` | 删除域名（释放用户名） | 是 |
| POST | `/api/domains/verify` | 触发源站验证 | 是 |

**邮箱管理（需认证）：**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/mails` | 获取邮件列表（分页） | 是 |
| GET | `/api/mails/:id` | 获取单封邮件详情 | 是 |
| DELETE | `/api/mails/:id` | 删除单封邮件 | 是 |
| DELETE | `/api/mails` | 批量删除邮件 | 是 |
| GET | `/api/settings/email` | 获取邮箱设置 | 是 |
| PUT | `/api/settings/email` | 更新转发邮箱等设置 | 是 |

**通用响应格式：**

```json
// 成功
{
  "success": true,
  "data": { ... }
}

// 失败
{
  "success": false,
  "error": {
    "code": "USERNAME_TAKEN",
    "message": "该用户名已被注册"
  }
}
```

**通用错误码：**

| HTTP 状态码 | 错误码 | 说明 |
|-------------|--------|------|
| 400 | `INVALID_INPUT` | 请求参数校验失败 |
| 401 | `UNAUTHORIZED` | 未登录或 Token 过期 |
| 403 | `FORBIDDEN` | 无权限操作 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `USERNAME_TAKEN` | 用户名已被占用 |
| 429 | `RATE_LIMITED` | 请求过于频繁 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

#### 3.3.3 域名管理页面

| 字段 | 说明 | 必填 | 校验规则 |
|------|------|------|----------|
| 用户名 | 二级域名前缀，注册后不可修改 | 是 | 1-63 字符，小写字母/数字/连字符 |
| 源站地址 | 用户自托管网站的 HTTPS URL | 是 | 必须以 `https://` 开头，不允许 IP 地址 |
| 回源 Host | 源站绑定的域名 | 否 | 自动填充为源站地址的 hostname |

#### 3.3.4 邮箱管理页面

| 字段 | 说明 | 必填 |
|------|------|------|
| 邮箱地址 | 自动生成 `用户名@nomio.world`，不可修改 | 是 |
| 转发邮箱 | 外部邮箱地址（如 Gmail），开启后邮件自动转发 | 否 |
| 收件箱 | 内置收件箱，列表展示所有收到的纯文本邮件 | 自动 |

> **页面提示：** 本邮箱仅支持收信转发与内置收件箱阅读，暂不支持 SMTP 发信。

---

## 四、数据模型（D1 数据库）

### 4.1 用户表（users）

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,          -- 子域名前缀，如 'alice'
  password_hash TEXT NOT NULL,            -- PBKDF2 加密存储 (salt:hash)
  origin_url TEXT NOT NULL,               -- 源站 HTTPS URL
  origin_host TEXT NOT NULL,              -- 回源 Host 头
  forward_email TEXT,                     -- 外部转发邮箱（可选）
  email_enabled BOOLEAN DEFAULT 1,        -- 邮箱功能是否启用
  status TEXT DEFAULT 'active',           -- active | frozen | deleted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  total_mail_size INTEGER DEFAULT 0       -- 当前邮件总大小（字节）
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
```

### 4.2 邮件表（mails）

```sql
CREATE TABLE mails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message_id TEXT,                         -- 邮件 Message-ID（用于去重）
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,                               -- 纯文本正文
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  size INTEGER DEFAULT 0,                  -- 邮件大小（字节）
  is_read BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mails_user_id ON mails(user_id);
CREATE INDEX idx_mails_received_at ON mails(received_at);
CREATE INDEX idx_mails_message_id ON mails(message_id);
```

### 4.3 频率限制表（rate_limits）

```sql
-- 可选：用于更精细的频率控制
CREATE TABLE rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,                -- 如 'mail:user_id:from_address'
  window_start DATETIME NOT NULL,
  count INTEGER DEFAULT 1,
  UNIQUE(identifier, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, window_start);
```

> **备选方案：** 频率限制也可直接通过 `mails` 表的 `COUNT` 查询实现（如 3.2.2 节代码所示），无需额外表。此表仅在需要更复杂的限流策略时启用。

### 4.4 配额与清理策略

| 指标 | 限制 | 超限处理 |
|------|------|----------|
| 单用户邮件总数 | 无硬性限制 | 按总大小限制（100MB） |
| 单用户邮件总大小 | 100MB | 删除最早的 10% 邮件 |
| 用户不活跃 | 90 天未登录 | 状态变更为 `frozen` |
| 冻结后宽限期 | 30 天 | 状态变更为 `deleted`，级联删除所有邮件 |

### 4.5 数据生命周期

```
用户注册 ──> 状态: active
                │
                │  90 天未登录
                ▼
           状态: frozen ──> 停止接收新邮件
                │
                │  30 天仍未登录
                ▼
           状态: deleted ──> 级联删除所有邮件，释放用户名
```

---

## 五、安全与风控

### 5.1 传输安全

| 层级 | 措施 |
|------|------|
| 用户 ↔ Cloudflare | 强制 HTTPS，Cloudflare 边缘证书自动覆盖 `*.nomio.world` |
| Cloudflare ↔ 用户源站 | 仅允许 HTTPS 回源，拒绝 HTTP 明文传输 |
| 证书校验 | 回源时严格校验源站 SSL 证书有效性 |

### 5.2 源站验证（防恶意指向）

用户注册时填写的源站地址需通过所有权验证：

1. 用户填写源站 URL 后，系统生成唯一验证 Token
2. 用户需在源站部署文件 `{origin_url}/.well-known/nomio-verify.txt`，内容为该 Token
3. 系统发起 HTTP HEAD 请求验证文件内容
4. 验证通过后方可激活域名解析

**验证文件示例：**

```
https://myapp.vercel.app/.well-known/nomio-verify.txt
内容: nomio-verify=a1b2c3d4e5f6...
```

此机制可防止恶意用户将 `bank.nomio.world` 指向钓鱼网站。

### 5.3 邮件安全

| 风险 | 防护措施 |
|------|----------|
| 垃圾邮件轰炸 | 频率限制 + 大小限制 + 收件人数限制 |
| 字典爆破攻击 | 同一发件人 5 分钟内超 3 封即静默丢弃 |
| 存储耗尽攻击 | 单用户 100MB 配额 + 自动清理 |
| 域名信誉污染 | 不发信策略，从源头杜绝垃圾邮件出口 |
| 邮件头注入 | 使用 PostalMime 标准化解析，不直接拼接原始头 |

### 5.4 API 安全

| 措施 | 说明 |
|------|------|
| CORS 策略 | Hono `cors()` 中间件，仅允许 `https://nomio.world` 来源 |
| JWT 认证 | Hono `jwt()` 中间件自动验证 Token 签名与有效期 |
| 速率限制 | 登录接口：5 次/分钟；注册接口：3 次/小时；普通 API：60 次/分钟 |
| 输入校验 | 所有用户输入在 Worker 端进行二次校验，不信任前端 |
| SQL 注入防护 | 使用 D1 参数化查询（`bind()`），禁止字符串拼接 |
| 密码存储 | PBKDF2 (SHA-256, 100k 迭代) + 随机 Salt，使用 Web Crypto API |

### 5.5 数据备份

- D1 数据库自动备份（Cloudflare 托管，每日快照）
- 建议定期导出用户邮件数据至 R2 冷存储（可选）
- 用户主动删除账号时，数据在 30 天内可恢复（软删除）

---

## 六、部署与运维

### 6.1 快速部署（一键脚本）

**前置条件：**

```bash
# 1. 安装 wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 部署前检查
./scripts/pre-deploy-check.sh

# 4. 一键部署
./deploy.sh all
```

**分步部署：**

```bash
./deploy.sh db         # 仅创建数据库 + 初始化 schema
./deploy.sh api        # 仅部署 API Worker
./deploy.sh gateway    # 仅部署 Gateway Worker
./deploy.sh email      # 仅部署 Email Worker
./deploy.sh dashboard  # 仅构建并部署 Dashboard
./deploy.sh test       # 仅运行测试
```

### 6.2 手动部署步骤

```bash
# 1. 登录 Cloudflare
wrangler login

# 2. 创建 D1 数据库
wrangler d1 create nomio-db
# 记录输出的 database_id，填入各 wrangler.toml

# 3. 初始化数据库表
wrangler d1 execute nomio-db --file=./schema.sql

# 4. 生成 JWT_SECRET（写入 workers/api/wrangler.toml）
openssl rand -hex 32

# 5. 安装依赖并部署
cd workers/api && npm install && wrangler deploy
cd workers/gateway && npm install && wrangler deploy
cd workers/email && npm install && wrangler deploy

# 6. 构建并部署 Dashboard
cd dashboard && npm install && npm run build
npx wrangler pages deploy dist --project-name=nomio-dashboard
```

### 6.3 Cloudflare Dashboard 手动配置

部署 Workers 后，需在 Cloudflare Dashboard 中完成以下配置：

**DNS 记录：**

| 类型 | 名称 | 内容 | 代理 |
|------|------|------|------|
| A | `*.nomio.world` | `192.0.2.1`（占位） | 橙色云 |
| AAAA | `*.nomio.world` | `100::`（占位） | 橙色云 |
| MX | `nomio.world` | `route.mx.cloudflare.net` | DNS only |

**Email Routing：**
1. 进入 Cloudflare Dashboard → Email Routing
2. 添加 Catch-all 规则：`*@nomio.world` → Send to Worker → `nomio-email`

### 6.4 GitHub Actions CI/CD

项目已配置 `.github/workflows/deploy.yml`，推送到 `main` 分支自动部署。

**配置 Secrets：**

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需 Workers + Pages + D1 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

### 6.5 wrangler.toml 配置示例

**Gateway Worker：**

```toml
name = "nomio-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "*.nomio.world/*", zone_name = "nomio.world" }
]

[[d1_databases]]
binding = "DB"
database_name = "nomio-db"
database_id = "<your-database-id>"
```

**Email Worker：**

```toml
name = "nomio-email"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "nomio-db"
database_id = "<your-database-id>"

[vars]
MAX_MAIL_SIZE = "5242880"
RATE_LIMIT_COUNT = "3"
RATE_LIMIT_WINDOW = "300"
```

**API Worker：**

```toml
name = "nomio-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "nomio.world/api/*", zone_name = "nomio.world" }
]

[[d1_databases]]
binding = "DB"
database_name = "nomio-db"
database_id = "<your-database-id>"

[vars]
JWT_SECRET = "<your-jwt-secret>"
ALLOWED_ORIGINS = "https://nomio.world,https://www.nomio.world"
```

### 6.6 依赖清单

**Workers 共同依赖：**

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "postal-mime": "^2.2.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240117.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.22.0"
  }
}
```

**Dashboard 前端：**

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "ofetch": "^1.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}
```

### 6.7 部署步骤（旧版参考）

1. **注册域名：** 在 Cloudflare 注册或转入 `nomio.world`
2. **DNS 配置：**
   - 添加 `*.nomio.world` 泛域名 A/AAAA 记录，开启橙色云
   - 添加 `nomio.world` MX 记录指向 `route.mx.cloudflare.net`
3. **创建 D1 数据库：**
   ```bash
   npx wrangler d1 create nomio-db
   # 输出 database_id，填入各 wrangler.toml
   ```
4. **初始化数据库表：**
   ```bash
   npx wrangler d1 execute nomio-db --file=./schema.sql
   ```
5. **安装依赖并部署 Workers：**
   ```bash
   cd workers/api && npm install && npx wrangler deploy
   cd workers/gateway && npm install && npx wrangler deploy
   cd workers/email && npm install && npx wrangler deploy
   ```
6. **配置 Email Routing：** 在 Cloudflare Dashboard → Email Routing 中设置 Catch-all 指向 Email Worker
7. **构建并部署 Dashboard：**
   ```bash
   cd dashboard && npm install && npm run build
   npx wrangler pages deploy dist --project-name=nomio-dashboard
   ```

### 6.8 开发调试

```bash
# 本地启动 API Worker（Hono 热重载）
cd workers/api && npx wrangler dev

# 本地启动 Gateway Worker
cd workers/gateway && npx wrangler dev

# 本地启动 Dashboard 开发服务器（Vite HMR）
cd dashboard && npm run dev

# 查看 D1 数据库内容
npx wrangler d1 execute nomio-db --command "SELECT * FROM users"
```

> **本地开发注意：**
> - `wrangler dev` 默认使用内存模拟 D1，数据不持久。如需持久化，添加 `--persist` 参数。
> - Dashboard 的 Vite 开发服务器默认代理 `/api` 请求到本地 API Worker（需在 `vite.config.ts` 中配置 `proxy`）。

### 6.9 监控指标

| 指标 | 监控方式 | 告警阈值 |
|------|----------|----------|
| Worker 请求量 | Cloudflare Dashboard | - |
| Worker CPU 时间 | Cloudflare Dashboard | > 8ms（免费版上限 10ms） |
| Worker 错误率 | Cloudflare Analytics | > 1% |
| D1 存储用量 | Cloudflare Dashboard | > 4GB（上限 5GB） |
| 邮件接收量 | Email Worker 日志 | - |
| 用户活跃度 | `last_login_at` 统计 | - |
| 异常回源 | Worker 错误日志 | 502/504 频繁出现 |

### 6.10 扩缩容策略

- **水平扩展：** Cloudflare Workers 自动扩缩容，无需人工干预
- **数据库扩展：** D1 支持按需扩容，初期免费额度充足
- **瓶颈预判：** 当用户量 > 10,000 时，需关注 D1 读取性能，可引入 Workers KV 作为缓存层
- **成本预估：** 免费版可支撑约 10 万日请求量；超出后按 $0.30/百万请求计费

---

## 七、已知限制与未来规划

### 7.1 当前版本限制

| 限制 | 说明 | 规避方案 |
|------|------|----------|
| 仅支持收信 | 不提供 SMTP 发信 | 使用第三方邮箱客户端代发 |
| 仅纯文本 | 不支持 HTML 邮件渲染 | 正文自动剥离 HTML 标签 |
| 无附件存储 | 邮件附件被丢弃 | 如需附件可考虑接入 R2 存储 |
| 无自定义域名 | 仅支持 `*.nomio.world` | 未来可扩展支持绑定自有域名 |
| 无邮件搜索 | 邮件列表仅按时间排序 | 未来可接入全文搜索索引 |

### 7.2 未来可扩展方向

- **邮件发送：** 对接 SendGrid / Mailgun API，提供受限的发信能力
- **附件支持：** 使用 R2 存储附件，提供下载链接
- **自定义域名：** 支持用户绑定自有域名（需 DNS 验证所有权）
- **Webhook 通知：** 新邮件到达时推送至用户配置的 Webhook URL
- **邮件规则：** 支持用户配置自动分类、转发、删除规则
- **多语言支持：** Dashboard 支持中/英文切换
- **管理后台：** 平台管理员可查看全局统计、处理滥用举报

---

## 八、术语表

| 术语 | 说明 |
|------|------|
| 泛域名解析 | 使用 `*.nomio.world` 一条记录覆盖所有子域名 |
| 橙色云 | Cloudflare 代理开启状态，流量经边缘节点 |
| 回源 | Cloudflare 边缘节点向用户源站发起请求 |
| Catch-all | 邮件路由中捕获所有未匹配地址的规则 |
| Hono | 轻量级 Web 框架，原生支持 Cloudflare Workers |
| Email Worker | 处理入站邮件的 Cloudflare Worker |
| D1 | Cloudflare 提供的边缘 SQLite 数据库服务 |
| JWT | JSON Web Token，用于无状态身份认证 |
| PBKDF2 | 基于密码的密钥派生函数，用于安全哈希密码 |
| PostalMime | 用于解析 MIME 格式邮件的 JavaScript 库 |
| Wrangler | Cloudflare 官方 CLI 工具，用于部署和管理 Workers |
| Vite | 下一代前端构建工具，支持 Vue 3 热重载 |
| Pinia | Vue 3 官方状态管理库 |
