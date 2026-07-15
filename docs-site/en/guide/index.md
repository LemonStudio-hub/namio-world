# Introduction

Welcome to Nomio.World! This is an open source public digital identity service that provides free subdomains and email addresses.

## What is Nomio.World?

Nomio.World is a public welfare digital identity infrastructure service based on the Cloudflare edge computing platform. The name comes from **Name + I/O**, meaning "entry service for domains and emails".

### Core Features

- **Free Domain** - Get `your-name.nomio.world` subdomain
- **Free Email** - Get `your-name@nomio.world` email address
- **Edge Computing** - Based on Cloudflare global network, low latency
- **Secure & Reliable** - Forced HTTPS, JWT authentication
- **Fully Open Source** - AGPL-3.0 license, transparent code

### Technical Architecture

Nomio.World is built with modern technology stack:

| Component | Technology | Description |
|-----------|------------|-------------|
| API Service | Cloudflare Workers | Edge computing runtime |
| Database | Cloudflare D1 | Edge SQLite database |
| Gateway | Cloudflare Workers | Domain forwarding |
| Email | Cloudflare Email Routing | Email receiving |
| Frontend | Vue 3 + Vite | Modern frontend framework |

### How It Works

When a user visits `alice.nomio.world`:

1. DNS resolves to Cloudflare edge nodes
2. Gateway Worker extracts subdomain `alice`
3. Queries D1 database for origin URL
4. Forwards request to origin, rewrites Host header
5. Passes through response, injects security headers

## Use Cases

- **Individual Developers** - Get free personal domain and email
- **Open Source Projects** - Provide professional domain and email for projects
- **Students** - Learn and showcase personal projects
- **Testing Environments** - Quickly create test domains

## Next Steps

- [Quick Start](/en/guide/getting-started) - Register and start using
- [Configure Domain](/en/guide/domain) - Learn about domain configuration
- [Using Email](/en/guide/email) - Learn about email features
