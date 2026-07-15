# Deployment Overview

This chapter introduces how to self-deploy Nomio.World.

## Architecture

Nomio.World consists of the following components:

| Component | Description | Deployment |
|-----------|-------------|------------|
| API Worker | API service | Cloudflare Workers |
| Gateway Worker | Domain forwarding | Cloudflare Workers |
| Email Worker | Email receiving | Cloudflare Workers |
| Dashboard | Frontend interface | Cloudflare Pages |
| Database | Database | Cloudflare D1 |

## Prerequisites

### Cloudflare Account

Need Cloudflare account and the following permissions:
- Workers
- D1
- Pages
- Email Routing

### Development Environment

- Node.js 18+
- npm or yarn
- Git

## Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/LemonStudio-hub/nomio-world.git
cd nomio-world
```

### 2. Install Dependencies

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

### 3. Create Database

```bash
wrangler d1 create nomio-db
```

### 4. Configure Environment Variables

Update configuration in `workers/*/wrangler.toml`:
- `database_id` - D1 database ID
- `JWT_SECRET` - JWT secret

### 5. Initialize Database

```bash
wrangler d1 execute nomio-db --file=../schema.sql
```

### 6. Deploy Workers

```bash
# API Worker
cd workers/api && wrangler deploy

# Gateway Worker
cd ../gateway && wrangler deploy

# Email Worker
cd ../email && wrangler deploy
```

### 7. Deploy Dashboard

```bash
cd dashboard
npm run build
wrangler pages deploy dist --project-name=nomio-dashboard
```

## Configuration

### DNS Configuration

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | *.nomio.world | 192.0.2.1 | Proxied |
| A | nomio.world | 192.0.2.1 | Proxied |
| MX | nomio.world | route.mx.cloudflare.net | DNS only |

### Email Routing

1. Go to Cloudflare Dashboard → Email
2. Enable Email Routing
3. Configure Catch-all rule → Route to Email Worker

## Environment Variables

### API Worker

| Variable | Description |
|----------|-------------|
| JWT_SECRET | JWT secret |
| ALLOWED_ORIGINS | Allowed origins |

### Email Worker

| Variable | Description |
|----------|-------------|
| MAX_MAIL_SIZE | Maximum mail size |
| RATE_LIMIT_COUNT | Rate limit count |
| RATE_LIMIT_WINDOW | Rate limit window |

## Next Steps

- [Workers Deploy](/en/deploy/workers) - Learn about Workers deployment
- [Dashboard Deploy](/en/deploy/dashboard) - Learn about Dashboard deployment
- [DNS Configuration](/en/deploy/dns) - Learn about DNS configuration
