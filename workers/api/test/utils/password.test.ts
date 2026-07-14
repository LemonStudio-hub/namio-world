/**
 * password.ts 单元测试
 * 覆盖哈希生成、验证正确性、不同密码不匹配、格式正确性
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('hashPassword', () => {
  it('返回 salt:hash 格式的字符串', async () => {
    const hash = await hashPassword('testpassword123');
    expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
  });

  it('相同密码生成不同哈希（随机 salt）', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    // salt 不同，哈希值应不同
    expect(hash1).not.toBe(hash2);
    // 但 salt 部分应该不同
    expect(hash1.split(':')[0]).not.toBe(hash2.split(':')[0]);
  });

  it('哈希结果包含正确的 salt 长度（32 hex = 16 bytes）', async () => {
    const hash = await hashPassword('test');
    const salt = hash.split(':')[0]!;
    expect(salt.length).toBe(32);
  });

  it('哈希结果包含正确的 hash 长度（64 hex = 32 bytes = 256 bits）', async () => {
    const hash = await hashPassword('test');
    const hashPart = hash.split(':')[1]!;
    expect(hashPart.length).toBe(64);
  });
});

describe('verifyPassword', () => {
  it('验证正确密码返回 true', async () => {
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('correctpassword', hash);
    expect(result).toBe(true);
  });

  it('验证错误密码返回 false', async () => {
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('大小写敏感', async () => {
    const hash = await hashPassword('Password');
    expect(await verifyPassword('password', hash)).toBe(false);
    expect(await verifyPassword('PASSWORD', hash)).toBe(false);
    expect(await verifyPassword('Password', hash)).toBe(true);
  });

  it('空密码验证', async () => {
    const hash = await hashPassword('');
    expect(await verifyPassword('', hash)).toBe(true);
    expect(await verifyPassword('a', hash)).toBe(false);
  });

  it('长密码验证', async () => {
    const longPassword = 'a'.repeat(1000);
    const hash = await hashPassword(longPassword);
    expect(await verifyPassword(longPassword, hash)).toBe(true);
    expect(await verifyPassword(longPassword + 'b', hash)).toBe(false);
  });

  it('Unicode 密码验证', async () => {
    const unicodePassword = '密码123!@#';
    const hash = await hashPassword(unicodePassword);
    expect(await verifyPassword(unicodePassword, hash)).toBe(true);
    expect(await verifyPassword('password', hash)).toBe(false);
  });

  it('处理无效的 stored 格式（无冒号）', async () => {
    const result = await verifyPassword('test', 'invalidformat');
    expect(result).toBe(false);
  });

  it('处理空的 stored 字符串', async () => {
    const result = await verifyPassword('test', '');
    expect(result).toBe(false);
  });

  it('处理只有 salt 无 hash', async () => {
    const result = await verifyPassword('test', 'abcdef1234567890abcdef1234567890:');
    expect(result).toBe(false);
  });

  it('处理只有 hash 无 salt', async () => {
    const result = await verifyPassword('test', ':abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(result).toBe(false);
  });

  it('修改存储哈希的一位导致验证失败', async () => {
    const hash = await hashPassword('testpassword');
    const [salt, hashPart] = hash.split(':');
    // 修改 hash 的最后一位
    const lastChar = hashPart!.slice(-1);
    const modifiedChar = lastChar === 'a' ? 'b' : 'a';
    const modifiedHash = `${salt}:${hashPart!.slice(0, -1)}${modifiedChar}`;
    expect(await verifyPassword('testpassword', modifiedHash)).toBe(false);
  });

  it('修改存储 salt 的一位导致验证失败', async () => {
    const hash = await hashPassword('testpassword');
    const [salt, hashPart] = hash.split(':');
    const lastChar = salt!.slice(-1);
    const modifiedChar = lastChar === 'a' ? 'b' : 'a';
    const modifiedHash = `${salt!.slice(0, -1)}${modifiedChar}:${hashPart}`;
    expect(await verifyPassword('testpassword', modifiedHash)).toBe(false);
  });
});

describe('hashPassword + verifyPassword 端到端', () => {
  const passwords = [
    'simple',
    'with spaces',
    'with-special-chars!@#$%^&*()',
    '12345678',
    'a'.repeat(500),
    '中文密码',
    '🔐🔑🛡️',
    '   leading and trailing spaces   ',
    'line1\nline2\nline3',
  ];

  passwords.forEach((pw) => {
    it(`正确处理密码: "${pw.slice(0, 30)}${pw.length > 30 ? '...' : ''}"`, async () => {
      const hash = await hashPassword(pw);
      expect(await verifyPassword(pw, hash)).toBe(true);
      expect(await verifyPassword(pw + 'x', hash)).toBe(false);
    });
  });
});
