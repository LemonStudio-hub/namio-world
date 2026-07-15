# Quick Start

Get started with Nomio.World in just three steps.

## Step 1: Register Account

1. Visit [Nomio.World](https://nomio-dashboard.pages.dev)
2. Click the "Get Started Free" button
3. Fill in registration information:
   - **Username** - Will be your subdomain prefix (e.g., `alice`)
   - **Password** - At least 8 characters
4. Click the "Register" button

::: tip Username Rules
- Can only contain lowercase letters, numbers, and hyphens
- Length 3-32 characters
- Cannot start or end with a hyphen
- Cannot be changed after registration
:::

## Step 2: Register Domain

After logging in, go to the "Domains" page:

1. Click "Register Subdomain"
2. Fill in origin information:
   - Must start with `https://`
   - IP addresses are not supported
   - Origin must respond to HTTPS requests
3. (Optional) Fill in Origin Host
4. Click "Register Domain"

::: warning Origin Requirements
Your origin must:
- Support HTTPS
- Have a valid SSL certificate
- Be able to respond to HTTP requests
:::

## Step 3: Verify Origin

After registering a domain, you need to verify origin ownership:

1. Create a file on your origin: `/.well-known/nomio-verify.txt`
2. File content is the verification token shown on the page
3. Click the "Verify Origin" button

::: tip Verification Failed?
- Ensure the file is accessible via HTTPS
- Ensure the file content matches exactly (no extra spaces or line breaks)
- Ensure the origin does not redirect this path
:::

## Register Email (Optional)

You can also register an email address:

1. Go to the "Mailbox" page
2. Click "Register Email"
3. (Optional) Fill in forwarding email
4. Click "Register Email"

After successful registration, you will get `your-name@nomio.world` email address.

## Start Using

After completing the above steps:

- Visit `your-name.nomio.world` to view your website
- Use `your-name@nomio.world` to receive emails
- Manage domains and emails in the dashboard

## Next Steps

- [Configure Domain](/en/guide/domain) - Learn more about domain configuration
- [Using Email](/en/guide/email) - Learn more about email features
- [Origin Verification](/en/guide/verification) - Learn about verification details
