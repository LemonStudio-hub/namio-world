# API 概览

Nomio.World 提供 RESTful API 用于管理域名和邮箱。

## API 地址

```
https://nomio-api.pages.dev
```

## 认证方式

使用 JWT Token 进行认证：

```bash
Authorization: Bearer <your-token>
```

## API 端点

### 认证

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /auth/register | 注册账号 |
| POST | /auth/login | 登录 |
| POST | /auth/logout | 退出 |
| GET | /auth/me | 获取用户信息 |

### 域名

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /domains | 获取域名信息 |
| POST | /domains/register | 注册域名 |
| PUT | /domains | 更新域名 |
| DELETE | /domains | 删除域名 |
| POST | /domains/verify | 验证源站 |

### 邮箱

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /mails | 获取邮件列表 |
| GET | /mails/:id | 获取邮件详情 |
| POST | /mails/register | 注册邮箱 |
| PUT | /mails/:id/read | 标记已读 |
| PUT | /mails/:id/unread | 标记未读 |
| PUT | /mails/:id/star | 切换星标 |
| DELETE | /mails/:id | 删除邮件 |
| POST | /mails | 批量删除邮件 |

### 设置

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /settings/email | 获取邮箱设置 |
| PUT | /settings/email | 更新邮箱设置 |

## 请求示例

### 注册账号

```bash
curl -X POST https://nomio-api.pages.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

### 登录

```bash
curl -X POST https://nomio-api.pages.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

### 获取域名信息

```bash
curl https://nomio-api.pages.dev/domains \
  -H "Authorization: Bearer <your-token>"
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "错误信息"
  }
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 限流

API 有频率限制：
- 同一 IP 每分钟最多 60 次请求
- 同一用户每分钟最多 120 次请求

## 下一步

- [认证 API](/api/auth) - 了解认证接口
- [域名 API](/api/domains) - 了解域名接口
- [邮箱 API](/api/mails) - 了解邮箱接口
