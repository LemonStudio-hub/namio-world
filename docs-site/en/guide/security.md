# Security Settings

This chapter introduces Nomio.World's security mechanisms.

## Security Features

### Forced HTTPS

All requests are transmitted through HTTPS encryption:
- Automatic HTTP to HTTPS redirect
- Uses Cloudflare SSL certificate
- Supports TLS 1.2+

### JWT Authentication

Uses JWT (JSON Web Token) for authentication:
- Token valid for 7 days
- Automatic refresh mechanism
- Secure storage method

### PBKDF2 Password Hashing

Passwords are hashed using PBKDF2 algorithm:
- 100,000 iterations
- SHA-256 hash algorithm
- Random salt value

### CORS Protection

Strict CORS (Cross-Origin Resource Sharing) policy:
- Restrict allowed origins
- Prevent cross-site request forgery

## Security Mechanisms

### Input Validation

All user inputs are strictly validated:
- Username format validation
- Password strength validation
- URL format validation

### Rate Limiting

Prevent malicious requests:
- Maximum 3 emails per sender in 5 minutes
- API request rate limiting

### File Size Limit

Prevent resource abuse:
- Maximum 5MB per email
- 100MB email storage quota

## Account Security

### Password Security

Recommendations:
- Use at least 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Don't use common passwords
- Don't use the same password on multiple websites

### Login Security

- Login failures display error messages
- Multiple failures may trigger verification
- Recommend changing password regularly

### Session Security

- Token stored in localStorage
- Token remains valid after page close
- Recommend logging out on public devices

## Data Security

### Data Storage

- Data stored in Cloudflare D1 database
- Uses Cloudflare global network
- Automatic backup

### Data Transmission

- All data transmitted via HTTPS
- Uses TLS encryption
- Prevent man-in-the-middle attacks

### Data Deletion

- Account deletion permanently deletes data
- Email deletion cannot be recovered
- Recommend regularly backing up important data

## Security Recommendations

### Account Security

1. Use strong password
2. Change password regularly
3. Don't share account
4. Log out promptly

### Domain Security

1. Verify origin ownership
2. Use HTTPS origin
3. Regularly check domain status

### Email Security

1. Configure forwarding email
2. Regularly clean emails
3. Don't publicize email address

## Security Incidents

### Vulnerability Discovery

If you discover a security vulnerability, please report through:
- GitHub Issues
- Email contact

### Response Time

- Critical vulnerabilities: Response within 24 hours
- General vulnerabilities: Response within 72 hours

## Common Questions

### Is password storage secure?

Yes, passwords are hashed using PBKDF2 algorithm and are irreversible.

### Will data be leaked?

We take strict security measures to protect data, but no system is 100% secure.

### How to protect account security?

Use strong password, change password regularly, don't share account.

### Is two-factor authentication supported?

Currently not supported, planned for future versions.

## Next Steps

- [FAQ](/en/guide/faq) - View frequently asked questions
