/**
 * 子域名校验工具
 */

const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'email', 'api', 'admin', 'dashboard',
  'app', 'cdn', 'static', 'assets', 'blog', 'docs',
  'support', 'help', 'status', 'staging', 'dev', 'test',
  'root', 'noreply', 'postmaster', 'abuse', 'security',
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 校验子域名合法性
 * - 长度 1-63 字符（DNS 标签限制）
 * - 仅允许小写字母、数字、连字符
 * - 不能以连字符开头或结尾
 * - 不在保留词列表中
 */
export function validateSubdomain(subdomain: string): ValidationResult {
  if (subdomain.length < 1 || subdomain.length > 63) {
    return { valid: false, error: '用户名长度须为 1-63 个字符' };
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return { valid: false, error: '仅允许小写字母、数字和连字符，且不能以连字符开头或结尾' };
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { valid: false, error: '该用户名为系统保留，不可注册' };
  }
  return { valid: true };
}

/**
 * 校验源站 URL 格式
 */
export function validateOriginUrl(url: string): ValidationResult {
  if (!url.startsWith('https://')) {
    return { valid: false, error: '源站必须使用 HTTPS' };
  }
  try {
    const parsed = new URL(url);
    // 不允许 IP 地址
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
      return { valid: false, error: '不允许使用 IP 地址作为源站' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: '源站 URL 格式无效' };
  }
}

/**
 * 校验邮箱格式
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
