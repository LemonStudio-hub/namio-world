# API Overview

Nomio.World provides RESTful API for managing domains and emails.

## API URL

```
https://nomio-api.pages.dev
```

## Authentication

Use JWT Token for authentication:

```bash
Authorization: Bearer <your-token>
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register account |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get user info |

### Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /domains | Get domain info |
| POST | /domains/register | Register domain |
| PUT | /domains | Update domain |
| DELETE | /domains | Delete domain |
| POST | /domains/verify | Verify origin |

### Mails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /mails | Get mail list |
| GET | /mails/:id | Get mail detail |
| POST | /mails/register | Register email |
| PUT | /mails/:id/read | Mark as read |
| PUT | /mails/:id/unread | Mark as unread |
| PUT | /mails/:id/star | Toggle star |
| DELETE | /mails/:id | Delete mail |
| POST | /mails | Batch delete mails |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /settings/email | Get email settings |
| PUT | /settings/email | Update email settings |

## Request Examples

### Register Account

```bash
curl -X POST https://nomio-api.pages.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST https://nomio-api.pages.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

### Get Domain Info

```bash
curl https://nomio-api.pages.dev/domains \
  -H "Authorization: Bearer <your-token>"
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error message"
  }
}
```

## Error Codes

| Error Code | Description |
|------------|-------------|
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 429 | Too many requests |
| 500 | Internal server error |

## Rate Limiting

API has rate limits:
- Maximum 60 requests per minute per IP
- Maximum 120 requests per minute per user

## Next Steps

- [Authentication API](/en/api/auth) - Learn about authentication endpoints
- [Domains API](/en/api/domains) - Learn about domain endpoints
- [Mails API](/en/api/mails) - Learn about mail endpoints
