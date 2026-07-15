# Register Account

This chapter introduces how to register a Nomio.World account.

## Registration Process

### 1. Visit Registration Page

Open your browser and visit [Nomio.World](https://nomio-dashboard.pages.dev), click the "Get Started Free" button.

### 2. Fill in Registration Information

| Field | Description | Required |
|-------|-------------|----------|
| Username | Subdomain prefix | ✅ |
| Password | At least 8 characters | ✅ |
| Confirm Password | Enter password again | ✅ |

### 3. Submit Registration

Click the "Register" button to complete registration. After successful registration, you will be automatically logged in and redirected to the dashboard.

## Username Rules

The username will be your subdomain prefix and must follow these rules:

### Allowed Characters
- Lowercase letters: `a-z`
- Numbers: `0-9`
- Hyphens: `-`

### Length Requirements
- Minimum: 3 characters
- Maximum: 32 characters

### Naming Rules
- Cannot start or end with a hyphen
- Cannot contain consecutive hyphens
- Cannot be changed after registration

### Examples

| Username | Domain | Status |
|----------|--------|--------|
| alice | alice.nomio.world | ✅ Valid |
| bob123 | bob123.nomio.world | ✅ Valid |
| my-app | my-app.nomio.world | ✅ Valid |
| ab | - | ❌ Too short |
| -alice | - | ❌ Starts with hyphen |
| alice- | - | ❌ Ends with hyphen |
| Alice | - | ❌ Contains uppercase |

## Security Recommendations

### Password Security
- Use at least 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Don't use common passwords
- Don't use the same password on multiple websites

### Account Security
- Change password regularly
- Don't share your account
- Log out promptly

## Common Questions

### Username Already Registered
If the username is already registered, the system will prompt "Username already exists". Please try another username.

### Registration Failed
Possible reasons for registration failure:
- Network connection issues
- Username doesn't meet rules
- Password doesn't meet requirements

### Forgot Password
Currently, password reset is not supported. If you forget your password, please contact the administrator.

## Next Steps

- [Configure Domain](/en/guide/domain) - Configure your subdomain
- [Using Email](/en/guide/email) - Register and use email
