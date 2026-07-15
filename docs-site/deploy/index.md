# 部署概览

本章介绍如何自部署 Nomio.World。

## 架构说明

Nomio.World 由以下组件组成：

| 组件 | 说明 | 部署方式 |
|------|------|----------|
| API Worker | API 服务 | Cloudflare Workers |
| Gateway Worker | 域名转发 | Cloudflare Workers |
| Email Worker | 邮件接收 | Cloudflare Workers |
| Dashboard | 前端界面 | Cloudflare Pages |
| Database | 数据库 | Cloudflare D1 |

## 前置要求

### Cloudflare 账户

需要 Cloudflare 账户和以下权限：
- Workers
- D1
- Pages
- Email Routing

### 开发环境

- Node.js 18+
- npm 或 yarn
- Git

## 部署步骤

### 1. 克隆仓库

```bash
git clone https://github.com/LemonStudio-hub/nomio-world.git
cd nomio-world
```

### 2. 安装依赖

```bash
# API Worker
cd workers/api && npm install

# Gateway Worker
cd ../gateway && npm install

# Email Worker
cd ../email && npm install

# Dashboard
cd ../../dashboard && npm install
```

### 3. 创建数据库

```bash
wrangler d1 create nomio-db
```

### 4. 配置环境变量

更新 `workers/*/wrangler.toml` 中的配置：
- `database_id` - D1 数据库 ID
- `JWT_SECRET` - JWT 密钥

### 5. 初始化数据库

```bash
wrangler d1 execute nomio-db --file=../schema.sql
```

### 6. 部署 Workers

```bash
# API Worker
cd workers/api && wrangler deploy

# Gateway Worker
cd ../gateway && wrangler deploy

# Email Worker
cd ../email && wrangler deploy
```

### 7. 部署 Dashboard

```bash
cd dashboard
npm run build
wrangler pages deploy dist --project-name=nomio-dashboard
```

## 配置说明

### DNS 配置

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| A | *.nomio.world | 192.0.2.1 | 已代理 |
| A | nomio.world | 192.0.2.1 | 已代理 |
| MX | nomio.world | route.mx.cloudflare.net | DNS only |

### Email Routing

1. 进入 Cloudflare Dashboard → Email
2. 启用 Email Routing
3. 配置 Catch-all 规则 → 路由到 Email Worker

## 环境变量

### API Worker

| 变量 | 说明 |
|------|------|
| JWT_SECRET | JWT 密钥 |
| ALLOWED_ORIGINS | 允许的来源 |

### Email Worker

| 变量 | 说明 |
|------|------|
| MAX_MAIL_SIZE | 最大邮件大小 |
| RATE_LIMIT_COUNT | 频率限制次数 |
| RATE_LIMIT_WINDOW | 频率限制窗口 |

## 下一步

- [Workers 部署](/deploy/workers) - 了解 Workers 部署详情
- [Dashboard 部署](/deploy/dashboard) - 了解 Dashboard 部署详情
- [DNS 配置](/deploy/dns) - 了解 DNS 配置
