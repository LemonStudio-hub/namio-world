/**
 * validator.ts 单元测试
 * 覆盖所有校验规则的边界情况
 */

import { describe, it, expect } from 'vitest';
import { validateSubdomain, validateOriginUrl, validateEmail } from '../../src/utils/validator';

// ============================================================
// validateSubdomain
// ============================================================
describe('validateSubdomain', () => {
  // ---- 正常情况 ----
  it('接受纯字母子域名', () => {
    const result = validateSubdomain('alice');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('接受纯数字子域名', () => {
    expect(validateSubdomain('123').valid).toBe(true);
  });

  it('接受字母数字混合', () => {
    expect(validateSubdomain('user42').valid).toBe(true);
  });

  it('接受含连字符的子域名', () => {
    expect(validateSubdomain('my-app').valid).toBe(true);
  });

  it('接受单字符子域名', () => {
    expect(validateSubdomain('a').valid).toBe(true);
  });

  it('接受单数字子域名', () => {
    expect(validateSubdomain('1').valid).toBe(true);
  });

  it('接受 63 字符子域名（DNS 标签上限）', () => {
    const subdomain = 'a'.repeat(63);
    expect(validateSubdomain(subdomain).valid).toBe(true);
  });

  // ---- 长度校验 ----
  it('拒绝空字符串', () => {
    const result = validateSubdomain('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('长度');
  });

  it('拒绝超过 63 字符', () => {
    const subdomain = 'a'.repeat(64);
    const result = validateSubdomain(subdomain);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('长度');
  });

  // ---- 格式校验 ----
  it('拒绝大写字母', () => {
    const result = validateSubdomain('Alice');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('小写字母');
  });

  it('拒绝以连字符开头', () => {
    const result = validateSubdomain('-alice');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('连字符');
  });

  it('拒绝以连字符结尾', () => {
    const result = validateSubdomain('alice-');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('连字符');
  });

  it('拒绝包含下划线', () => {
    const result = validateSubdomain('my_app');
    expect(result.valid).toBe(false);
  });

  it('拒绝包含特殊字符', () => {
    expect(validateSubdomain('my app').valid).toBe(false);
    expect(validateSubdomain('my@app').valid).toBe(false);
    expect(validateSubdomain('my.app').valid).toBe(false);
    expect(validateSubdomain('my/app').valid).toBe(false);
  });

  it('拒绝包含中文', () => {
    expect(validateSubdomain('中文').valid).toBe(false);
  });

  it('拒绝包含空格', () => {
    expect(validateSubdomain('a b').valid).toBe(false);
  });

  // ---- 保留词校验 ----
  it.each([
    'www', 'mail', 'email', 'api', 'admin', 'dashboard',
    'app', 'cdn', 'static', 'assets', 'blog', 'docs',
    'support', 'help', 'status', 'staging', 'dev', 'test',
    'root', 'noreply', 'postmaster', 'abuse', 'security',
  ])('拒绝保留词: %s', (reserved) => {
    const result = validateSubdomain(reserved);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('保留');
  });

  it('拒绝保留词的大写变体不会被误判（大写本身已拒绝）', () => {
    // 大写被格式校验拦截，不是保留词拦截
    const result = validateSubdomain('WWW');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('小写字母');
  });

  // ---- 边界情况 ----
  it('拒绝仅含连字符', () => {
    const result = validateSubdomain('-');
    expect(result.valid).toBe(false);
  });

  it('接受以数字开头', () => {
    expect(validateSubdomain('42alice').valid).toBe(true);
  });

  it('接受以数字结尾', () => {
    expect(validateSubdomain('alice42').valid).toBe(true);
  });

  it('接受含多个连字符', () => {
    expect(validateSubdomain('my-cool-app').valid).toBe(true);
  });
});

// ============================================================
// validateOriginUrl
// ============================================================
describe('validateOriginUrl', () => {
  // ---- 正常情况 ----
  it('接受标准 HTTPS URL', () => {
    const result = validateOriginUrl('https://example.com');
    expect(result.valid).toBe(true);
  });

  it('接受带路径的 HTTPS URL', () => {
    expect(validateOriginUrl('https://example.com/app').valid).toBe(true);
  });

  it('接受带端口的 HTTPS URL', () => {
    expect(validateOriginUrl('https://example.com:443').valid).toBe(true);
  });

  it('接受 Vercel 部署地址', () => {
    expect(validateOriginUrl('https://myapp.vercel.app').valid).toBe(true);
  });

  it('接受 Netlify 部署地址', () => {
    expect(validateOriginUrl('https://myapp.netlify.app').valid).toBe(true);
  });

  it('接受带子域名的 URL', () => {
    expect(validateOriginUrl('https://www.example.com').valid).toBe(true);
  });

  // ---- 协议校验 ----
  it('拒绝 HTTP URL', () => {
    const result = validateOriginUrl('http://example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('HTTPS');
  });

  it('拒绝无协议的 URL', () => {
    const result = validateOriginUrl('example.com');
    expect(result.valid).toBe(false);
  });

  it('拒绝 FTP URL', () => {
    const result = validateOriginUrl('ftp://example.com');
    expect(result.valid).toBe(false);
  });

  it('拒绝空字符串', () => {
    const result = validateOriginUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('HTTPS');
  });

  // ---- IP 地址校验 ----
  it('拒绝 IPv4 地址', () => {
    const result = validateOriginUrl('https://192.168.1.1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IP');
  });

  it('拒绝 localhost IPv4', () => {
    const result = validateOriginUrl('https://127.0.0.1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IP');
  });

  it('拒绝另一个 IPv4', () => {
    const result = validateOriginUrl('https://10.0.0.1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IP');
  });

  // ---- 格式校验 ----
  it('拒绝无效 URL', () => {
    const result = validateOriginUrl('https://');
    expect(result.valid).toBe(false);
  });

  it('拒绝仅含空格', () => {
    const result = validateOriginUrl('   ');
    expect(result.valid).toBe(false);
  });
});

// ============================================================
// validateEmail
// ============================================================
describe('validateEmail', () => {
  it('接受标准邮箱', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('接受带子域名的邮箱', () => {
    expect(validateEmail('user@mail.example.com')).toBe(true);
  });

  it('接受带加号的邮箱', () => {
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('接受带点的用户名', () => {
    expect(validateEmail('first.last@example.com')).toBe(true);
  });

  it('拒绝无 @ 符号', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('拒绝无域名', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('拒绝无用户名', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('拒绝无 TLD', () => {
    expect(validateEmail('user@example')).toBe(false);
  });

  it('拒绝空字符串', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('拒绝含空格', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('拒绝含多个 @', () => {
    expect(validateEmail('user@@example.com')).toBe(false);
  });
});
