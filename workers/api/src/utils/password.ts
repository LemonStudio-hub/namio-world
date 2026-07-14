/**
 * 密码哈希工具
 * 使用 Web Crypto API 的 PBKDF2 算法
 * - SHA-256 哈希
 * - 100,000 次迭代
 * - 16 字节随机 Salt
 * - 存储格式: saltHex:hashHex
 */

const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256;

/**
 * 对密码进行哈希处理
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH,
  );

  const hashArray = new Uint8Array(bits);
  const saltHex = toHex(salt);
  const hashHex = toHex(hashArray);

  return `${saltHex}:${hashHex}`;
}

/**
 * 验证密码是否匹配
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH,
  );

  const hashArray = new Uint8Array(bits);
  const computedHex = toHex(hashArray);

  return computedHex === hashHex;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
