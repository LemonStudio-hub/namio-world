# 简介

欢迎使用 Nomio.World！这是一个开源的公益数字身份服务，为用户提供免费的二级域名和邮箱地址。

## 什么是 Nomio.World？

Nomio.World 是一个基于 Cloudflare 边缘计算平台的公益数字身份基建服务。名称取自 **Name + I/O**，寓意"域名与邮箱的入口服务"。

### 核心特性

- **免费域名** - 获得 `your-name.nomio.world` 二级域名
- **免费邮箱** - 获得 `your-name@nomio.world` 邮箱地址
- **边缘计算** - 基于 Cloudflare 全球网络，低延迟
- **安全可靠** - 强制 HTTPS，JWT 认证
- **完全开源** - AGPL-3.0 协议，代码透明

### 技术架构

Nomio.World 采用现代技术栈构建：

| 组件 | 技术 | 说明 |
|------|------|------|
| API 服务 | Cloudflare Workers | 边缘计算运行时 |
| 数据库 | Cloudflare D1 | 边缘 SQLite 数据库 |
| 网关 | Cloudflare Workers | 域名转发 |
| 邮件 | Cloudflare Email Routing | 邮件接收 |
| 前端 | Vue 3 + Vite | 现代前端框架 |

### 工作原理

当用户访问 `alice.nomio.world` 时：

1. DNS 解析到 Cloudflare 边缘节点
2. Gateway Worker 提取子域名 `alice`
3. 查询 D1 数据库获取源站地址
4. 将请求转发到源站，重写 Host 头
5. 透传响应，注入安全头

## 适用场景

- **个人开发者** - 获得免费的个人域名和邮箱
- **开源项目** - 为项目提供专业的域名和邮箱
- **学生** - 学习和展示个人项目
- **测试环境** - 快速创建测试域名

## 下一步

- [快速开始](/guide/getting-started) - 立即注册并使用
- [配置域名](/guide/domain) - 了解域名配置
- [使用邮箱](/guide/email) - 了解邮箱功能
