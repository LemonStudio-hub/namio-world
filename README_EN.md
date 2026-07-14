<div align="center">

# Namio.World

**Public Digital Identity Infrastructure -- Gateway for Domains and Email**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-193%20passed-brightgreen.svg)](#testing)
[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)

[English](#) | [中文](README.md) | [Documentation](docs.md) | [Changelog](CHANGELOG.md)

</div>

---

## Introduction

Namio.World is a **public digital identity infrastructure** built on Cloudflare's edge computing platform, providing two core capabilities:

- **Subdomain Distribution** -- Get a free `username.namio.world` domain, reverse-proxied to your HTTPS origin server via our edge gateway
- **Email Hosting** -- Automatically receive a `username@namio.world` email address with plain-text email reception and storage

> **Namio** = Name + I/O -- "The gateway for names, input and output"

## Features

- **Completely Free** -- Leverages Cloudflare's free tier
- **Edge-First** -- Routing, email processing, and data access all happen at the edge
- **Secure by Default** -- Forced HTTPS origin, PBKDF2 password hashing, JWT authentication
- **Anti-Abuse** -- Rate limiting, storage quotas, origin server ownership verification
- **Email Hosting** -- Plain-text reception, auto-forwarding, built-in inbox
- **Global Access** -- Cloudflare's edge network spans the globe

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | TypeScript + Hono (Edge Web Framework) |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (Edge SQLite) |
| Email | Cloudflare Email Routing + PostalMime |
| Testing | Vitest + Vue Test Utils |
| Code Quality | ESLint + Prettier |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account

### Installation and Running

```bash
# Clone the repository
git clone https://github.com/your-org/namio-world.git
cd namio-world

# Install dependencies
cd workers/api && npm install && cd ../..
cd workers/gateway && npm install && cd ../..
cd workers/email && npm install && cd ../..
cd dashboard && npm install && cd ..

# Run tests
cd workers/api && npx vitest run && cd ../..
cd workers/gateway && npx vitest run && cd ../..
cd workers/email && npx vitest run && cd ../..
cd dashboard && npx vitest run && cd ..

# Local development (API Worker + Dashboard)
cd workers/api && npx wrangler dev &    # http://127.0.0.1:8787
cd dashboard && npm run dev &           # http://localhost:5173
```

### Deployment

```bash
# Login to Cloudflare
wrangler login

# Pre-deploy check
./scripts/pre-deploy-check.sh

# One-click deploy
./deploy.sh all
```

See [Deployment Guide](docs.md#6-quick-deploy-one-click-script) for details.

## Project Structure

```
namio/
├── workers/
│   ├── api/                    # Hono API backend (14 endpoints)
│   │   ├── src/
│   │   │   ├── routes/         # auth, domains, mails, settings
│   │   │   └── utils/          # validator, password, response
│   │   └── test/               # 154 tests
│   ├── gateway/                # Hono reverse proxy gateway
│   │   └── test/               # 9 tests
│   └── email/                  # Email reception Worker
│       └── test/               # 11 tests
├── dashboard/                  # Vue 3 frontend
│   ├── src/
│   │   ├── api/                # ofetch wrapper
│   │   ├── stores/             # Pinia state management
│   │   ├── router/             # Vue Router + navigation guards
│   │   └── views/              # 5 pages
│   └── test/                   # 19 tests
├── schema.sql                  # D1 database schema
├── deploy.sh                   # One-click deploy script
├── docs.md                     # Technical documentation
└── README.md                   # This file
```

## Testing

```bash
# Run all tests
cd workers/api && npx vitest run       # 154 tests
cd workers/gateway && npx vitest run   # 9 tests
cd workers/email && npx vitest run     # 11 tests
cd dashboard && npx vitest run         # 19 tests

# View coverage (Dashboard)
cd dashboard && npx vitest run --coverage
```

| Module | Tests | Status |
|--------|-------|--------|
| API Worker | 154 | All passing |
| Gateway Worker | 9 | All passing |
| Email Worker | 11 | All passing |
| Dashboard | 19 | All passing |
| **Total** | **193** | **All passing** |

## Documentation

| Document | Description |
|----------|-------------|
| [Technical Documentation](docs.md) | Architecture, API, data model, security |
| [Changelog](CHANGELOG.md) | Version history and changes |
| [Contributing Guide](CONTRIBUTING.md) | How to contribute |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community behavior standards |
| [Security Policy](SECURITY.md) | Vulnerability reporting and security policy |

## Contributing

We welcome all forms of contribution! Please read the [Contributing Guide](CONTRIBUTING.md) to learn:

- How to report bugs
- How to submit feature suggestions
- How to submit Pull Requests
- Code standards and testing requirements

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

```
Copyright (C) 2026 Namio.World Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

**AGPL Requirement:** If you modify this project's code and provide it as a service over a network (e.g., deploy as SaaS), you must make the modified source code available to users of that service.

## Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) -- Edge computing platform
- [Hono](https://hono.dev/) -- Lightweight web framework
- [Vue.js](https://vuejs.org/) -- Frontend framework
- [PostalMime](https://github.com/nicklayb/postal-mime) -- Email parsing library

---

<div align="center">

**[English](#)** | [中文](README.md) | [Documentation](docs.md) | [Changelog](CHANGELOG.md)

Made by Namio.World Contributors

</div>
