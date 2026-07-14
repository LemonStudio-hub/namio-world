<div align="center">

# Nomio.World

**公益数字身份基建服务 -- 域名与邮箱的入口**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-193%20passed-brightgreen.svg)](#测试)
[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)

[English](README_EN.md) | [中文](#) | [技术文档](docs.md) | [更新日志](CHANGELOG.md)

</div>

---

## 简介

Nomio.World 是一个基于 Cloudflare 边缘计算平台的**公益数字身份基建服务**，为用户提供两大核心能力：

- **二级域名分发** -- 免费申请 `username.nomio.world`，通过边缘网关反向代理到你的 HTTPS 源站
- **邮箱托管服务** -- 自动获得 `username@nomio.world` 邮箱，支持纯文本邮件接收与存储

> **Nomio** = Name + I/O，寓意"域名与邮箱的入口服务"

## 特性

- **完全免费** -- 充分利用 Cloudflare 免费额度
- **边缘优先** -- 路由、邮件处理、数据读写均在边缘节点完成
- **安全默认** -- 强制 HTTPS 回源，PBKDF2 密码哈希，JWT 认证
- **防滥用** -- 频率限制、存储配额、源站所有权验证
- **邮箱托管** -- 纯文本接收、自动转发、内置收件箱
- **全球接入** -- Cloudflare 边缘网络覆盖全球

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router |
| 后端 | TypeScript + Hono（边缘 Web 框架） |
| 运行时 | Cloudflare Workers |
| 数据库 | Cloudflare D1（边缘 SQLite） |
| 邮件 | Cloudflare Email Routing + PostalMime |
| 测试 | Vitest + Vue Test Utils |
| 代码质量 | ESLint + Prettier |

## 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare 账户

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-org/nomio-world.git
cd nomio-world

# 安装依赖
cd workers/api && npm install && cd ../..
cd workers/gateway && npm install && cd ../..
cd workers/email && npm install && cd ../..
cd dashboard && npm install && cd ..

# 运行测试
cd workers/api && npx vitest run && cd ../..
cd workers/gateway && npx vitest run && cd ../..
cd workers/email && npx vitest run && cd ../..
cd dashboard && npx vitest run && cd ..

# 本地开发（API Worker + Dashboard）
cd workers/api && npx wrangler dev &    # http://127.0.0.1:8787
cd dashboard && npm run dev &           # http://localhost:5173
```

### 部署

```bash
# 登录 Cloudflare
wrangler login

# 部署前检查
./scripts/pre-deploy-check.sh

# 一键部署
./deploy.sh all
```

详见 [部署指南](docs.md#六部署与运维)。

## 项目结构

```
nomio/
├── workers/
│   ├── api/                    # Hono API 后端（14 个接口）
│   │   ├── src/
│   │   │   ├── routes/         # auth, domains, mails, settings
│   │   │   └── utils/          # validator, password, response
│   │   └── test/               # 154 项测试
│   ├── gateway/                # Hono 反代网关
│   │   └── test/               # 9 项测试
│   └── email/                  # 邮件接收 Worker
│       └── test/               # 11 项测试
├── dashboard/                  # Vue 3 前端
│   ├── src/
│   │   ├── api/                # ofetch 封装
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── router/             # Vue Router + 导航守卫
│   │   └── views/              # 5 个页面
│   └── test/                   # 19 项测试
├── schema.sql                  # D1 数据库建表脚本
├── deploy.sh                   # 一键部署脚本
├── docs.md                     # 技术文档
└── README.md                   # 本文件
```

## 测试

```bash
# 运行全部测试
cd workers/api && npx vitest run       # 154 项
cd workers/gateway && npx vitest run   # 9 项
cd workers/email && npx vitest run     # 11 项
cd dashboard && npx vitest run         # 19 项

# 查看覆盖率（Dashboard）
cd dashboard && npx vitest run --coverage
```

| 模块 | 测试数 | 状态 |
|------|--------|------|
| API Worker | 154 | 全部通过 |
| Gateway Worker | 9 | 全部通过 |
| Email Worker | 11 | 全部通过 |
| Dashboard | 19 | 全部通过 |
| **总计** | **193** | **全部通过** |

## 文档

| 文档 | 说明 |
|------|------|
| [技术文档](docs.md) | 架构设计、API 接口、数据模型、安全机制 |
| [更新日志](CHANGELOG.md) | 版本历史与变更记录 |
| [贡献指南](CONTRIBUTING.md) | 如何参与贡献 |
| [行为准则](CODE_OF_CONDUCT.md) | 社区行为规范 |
| [安全策略](SECURITY.md) | 漏洞报告与安全政策 |

## 贡献

我们欢迎所有形式的贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解：

- 如何报告 Bug
- 如何提交功能建议
- 如何提交 Pull Request
- 代码规范与测试要求

## 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE) 开源。

```
Copyright (C) 2026 Nomio.World Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

**AGPL 要求：** 如果你修改本项目代码并通过网络提供服务（如部署为 SaaS），你必须向服务使用者公开修改后的完整源代码。

## 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) -- 边缘计算平台
- [Hono](https://hono.dev/) -- 轻量级 Web 框架
- [Vue.js](https://vuejs.org/) -- 前端框架
- [PostalMime](https://github.com/nicklayb/postal-mime) -- 邮件解析库

---

<div align="center">

**[English](README_EN.md)** | [技术文档](docs.md) | [更新日志](CHANGELOG.md)

Made by Nomio.World Contributors

</div>
