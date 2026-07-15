/**
 * 测试辅助工具
 * 提供 D1 Mock、Hono Context 构造、JWT 工具等
 */

import { sign } from 'hono/jwt';

// ---- D1 Mock ----

interface MockD1Row {
  [key: string]: unknown;
}

export function createMockD1(initialData: Record<string, MockD1Row[]> = {}) {
  const tables: Record<string, MockD1Row[]> = { ...initialData };
  let lastQuery = '';
  let lastBindings: unknown[] = [];

  function matchTable(sql: string): string | null {
    // INSERT INTO table / SELECT ... FROM table / UPDATE table / DELETE FROM table
    const m = sql.match(/(?:FROM|INTO|UPDATE)\s+["']?(\w+)["']?/i);
    return m?.[1]?.toLowerCase() || null;
  }

  const db = {
    prepare(sql: string) {
      lastQuery = sql;
      return {
        bind(...args: unknown[]) {
          lastBindings = args;
          return {
            async first<T = unknown>(): Promise<T | null> {
              const table = matchTable(sql);
              if (!table || !tables[table]) return null;

              // WHERE username = ? 等简单匹配
              if (sql.includes('WHERE') && args.length > 0) {
                const row = tables[table].find((r) => {
                  if (sql.includes('username = ?') && 'username' in r) {
                    return r.username === args[0];
                  }
                  if (sql.includes('id = ?') && 'id' in r) {
                    return r.id === args[0];
                  }
                  if (sql.includes('user_id = ?') && 'user_id' in r) {
                    return r.user_id === args[0];
                  }
                  return false;
                });
                return (row as T) || null;
              }

              // SELECT COUNT(*)
              if (sql.includes('COUNT(*)')) {
                const table2 = matchTable(sql);
                const rows = table2 ? tables[table2] || [] : [];
                // 简单的 WHERE 过滤
                if (sql.includes('user_id = ?') && args[0]) {
                  const filtered = rows.filter((r) => r.user_id === args[0]);
                  return { cnt: filtered.length } as T;
                }
                return { cnt: rows.length } as T;
              }

              // SELECT MAX / SUM
              if (sql.includes('SUM(') || sql.includes('MAX(')) {
                return { total: 0 } as T;
              }

              return tables[table]?.[0] as T || null;
            },
            async all<T = unknown>(): Promise<{ results: T[] }> {
              const table = matchTable(sql);
              if (!table || !tables[table]) return { results: [] };

              let rows = [...tables[table]];

              // 简单 WHERE 过滤
              if (sql.includes('user_id = ?') && args[0]) {
                rows = rows.filter((r) => r.user_id === args[0]);
              }

              // LIMIT / OFFSET
              const limitMatch = sql.match(/LIMIT\s+(\?|\d+)/i);
              const offsetMatch = sql.match(/OFFSET\s+(\?|\d+)/i);
              if (limitMatch) {
                const limitIdx = limitMatch[1] === '?' ? args.findIndex((_, i) => i >= 2) : parseInt(limitMatch[1]);
                const limit = typeof args[limitIdx] === 'number' ? args[limitIdx] as number : parseInt(limitMatch[1]);
                const offset = offsetMatch ? (typeof args[limitIdx + 1] === 'number' ? args[limitIdx + 1] as number : 0) : 0;
                rows = rows.slice(offset, offset + limit);
              }

              // ORDER BY (简单排序)
              if (sql.includes('ORDER BY') && sql.includes('DESC')) {
                rows.reverse();
              }

              return { results: rows as T[] };
            },
            async run() {
              const table = matchTable(sql);
              if (!table) return { success: true };

              // INSERT
              if (sql.startsWith('INSERT')) {
                if (!tables[table]) tables[table] = [];
                const cols = sql.match(/\(([^)]+)\)/)?.[1]?.split(',').map((s) => s.trim());
                const row: MockD1Row = {};
                cols?.forEach((col, i) => {
                  row[col] = args[i];
                });
                tables[table].push(row);
                return { success: true, meta: { last_row_id: tables[table].length } };
              }

              // UPDATE
              if (sql.startsWith('UPDATE')) {
                return { success: true };
              }

              // DELETE
              if (sql.startsWith('DELETE')) {
                if (sql.includes('user_id = ?') && args[0]) {
                  tables[table] = tables[table].filter((r) => r.user_id !== args[0]);
                }
                return { success: true };
              }

              return { success: true };
            },
          };
        },
        // 不带 bind 的调用
        async first<T = unknown>(): Promise<T | null> {
          const table = matchTable(sql);
          return (table && tables[table]?.[0]) as T || null;
        },
        async all<T = unknown>(): Promise<{ results: T[] }> {
          const table = matchTable(sql);
          return { results: (table && tables[table] || []) as T[] };
        },
        async run() {
          return { success: true };
        },
      };
    },
    async batch(statements: any[]) {
      for (const stmt of statements) {
        // D1PreparedStatement 已经有 run() 方法
        if (typeof stmt.run === 'function') {
          await stmt.run();
        } else if (stmt.query) {
          await db.prepare(stmt.query).bind(...(stmt.params || [])).run();
        }
      }
      return { success: true };
    },
    // 测试辅助方法
    _getTables: () => tables,
    _setTable: (name: string, rows: MockD1Row[]) => {
      tables[name] = rows;
    },
    _getLastQuery: () => lastQuery,
    _getLastBindings: () => lastBindings,
  };

  return db as unknown as D1Database & {
    _getTables(): Record<string, MockD1Row[]>;
    _setTable(name: string, rows: MockD1Row[]): void;
    _getLastQuery(): string;
    _getLastBindings(): unknown[];
  };
}

// ---- JWT 测试工具 ----

export async function createTestToken(username: string, secret = 'test-secret-key-for-testing', expOffset = 7 * 24 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: username, iat: now, exp: now + expOffset },
    secret,
  );
}

// ---- 测试数据 ----

export const TEST_USER = {
  id: 1,
  username: 'alice',
  password_hash: '', // 运行时填充
  origin_url: 'https://alice.example.com',
  origin_host: 'alice.example.com',
  has_domain: 1,
  has_email: 1,
  forward_email: null,
  email_enabled: 1,
  status: 'active',
  verify_token: 'test-verify-token-123',
  verify_status: 'pending',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_login_at: null,
  total_mail_size: 0,
};

export const TEST_MAIL = {
  id: 1,
  user_id: 1,
  message_id: 'msg-001',
  from_address: 'bob@example.com',
  to_address: 'alice@nomio.world',
  subject: 'Test Email',
  body: 'Hello, this is a test email.',
  html_body: '<p>Hello, this is a test email.</p>',
  received_at: '2026-01-15T10:00:00.000Z',
  size: 30,
  is_read: 0,
  is_starred: 0,
};

// ---- Hono 请求构造 ----

export function createRequest(
  path: string,
  options: RequestInit & { token?: string } = {},
): Request {
  const { token, ...init } = options;
  const url = `https://nomio.world${path}`;

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, { ...init, headers });
}

export function jsonBody(data: unknown): string {
  return JSON.stringify(data);
}
