# FAQ

## Domain Related

### How long does it take for the domain to be effective?

The domain is immediately effective after successful registration. Cloudflare DNS global propagation usually completes within minutes.

### What origins are supported?

Any origin that supports HTTPS is supported, including Vercel, Netlify, GitHub Pages, and self-hosted servers. IP addresses are not supported.

### Can the domain be customized?

Currently only `*.nomio.world` subdomains are supported. Custom domain support is planned for future versions.

### How to check domain status?

Domain verification status can be viewed on the domain management page.

### What if domain is banned?

If the domain is banned, please contact the administrator to understand the reason and apply for unbanning.

## Email Related

### Can the email send emails?

The current version only supports receiving emails, not sending. You can set up "Send as" in clients like Gmail.

### Is there a storage limit for emails?

Each user has 100MB email storage quota. After exceeding, the oldest emails are automatically deleted.

### How to forward emails to other emails?

Fill in the forwarding email address in email settings, and received emails will be automatically forwarded to that email.

### Can the email domain be customized?

Currently only `@nomio.world` email is supported. Custom domain email support is planned for future versions.

### How long does it take for the email to be effective?

The email is immediately effective after registration. You can receive emails immediately.

### How to check email size?

You can view the size of each email on the email list page.

## Account Related

### What if I forget my password?

Currently, password reset is not supported. If you forget your password, please contact the administrator.

### How to change username?

Username cannot be changed after registration. If you need a new username, please register a new account.

### How to delete account?

You can delete account on the settings page. After deletion, all data will be permanently deleted and cannot be recovered.

### What if account is frozen?

Account will be frozen after 90 days of inactivity. Please contact the administrator to apply for unfreezing.

## Technical Related

### What technology stack is used?

- Frontend: Vue 3 + Vite + TypeScript
- Backend: Cloudflare Workers + D1
- Deployment: Cloudflare Pages + Workers

### What is the open source license?

AGPL-3.0 open source license.

### How to contribute code?

Please check [Contributing Guide](/en/contributing) to learn how to contribute code.

### Is there API documentation?

Yes, please check [API Documentation](/en/api/) for detailed information.

## Deployment Related

### How to self-deploy?

Please check [Deployment Guide](/en/deploy/) to learn how to self-deploy.

### What are the costs?

Nomio.World is completely free for individual users. Self-deployment requires a Cloudflare account.

### What regions are supported?

Based on Cloudflare global network, supports global access.

## Other Questions

### How to contact administrator?

You can contact the administrator through GitHub Issues or email.

### Are there plans to add new features?

Yes, planned features include:
- Custom domains
- Email sending
- Two-factor authentication
- API rate limiting

### How to report vulnerabilities?

If you discover a security vulnerability, please report through GitHub Issues or email.

### Is there a community?

Yes, welcome to join our GitHub community.
