/**
 * Email Worker 集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index';

interface MockUser {
  id: number;
  username: string;
  total_mail_size: number;
  forward_email: string | null;
  status: string;
  email_enabled: number;
}

function createMockEnv(users: MockUser[] = [], mails: Record<string, unknown>[] = []) {
  const mailStore = [...mails];
  const userStore = users.map((u) => ({ ...u }));

  // 创建一个 D1PreparedStatement 对象
  function createStmt(sql: string, boundArgs: unknown[]) {
    const stmt = {
      sql,
      args: boundArgs,
      async first() {
        if (sql.includes('FROM users') && sql.includes('username = ?')) {
          const user = userStore.find((u) => u.username === boundArgs[0]);
          if (!user) return null;
          // 检查 status 条件
          if (sql.includes('status = ?') && user.status !== boundArgs[1]) return null;
          // 检查 email_enabled 条件
          if (sql.includes('email_enabled = 1') && !user.email_enabled) return null;
          return user || null;
        }
        if (sql.includes('FROM users') && sql.includes('id = ?')) {
          return userStore.find((u) => u.id === boundArgs[0]) || null;
        }
        if (sql.includes('COUNT(*)') && sql.includes('FROM mails')) {
          if (sql.includes('user_id = ?') && sql.includes('from_address = ?')) {
            const cnt = mailStore.filter(
              (m) => m.user_id === boundArgs[0] && m.from_address === boundArgs[1],
            ).length;
            return { cnt };
          }
          if (sql.includes('user_id = ?')) {
            return { cnt: mailStore.filter((m) => m.user_id === boundArgs[0]).length };
          }
          return { cnt: mailStore.length };
        }
        return null;
      },
      async all() {
        if (sql.includes('FROM mails') && sql.includes('user_id = ?')) {
          return { results: mailStore.filter((m) => m.user_id === boundArgs[0]) };
        }
        return { results: [] };
      },
      async run() {
        if (sql.startsWith('INSERT INTO mails')) {
          const cols = sql.match(/\(([^)]+)\)/)?.[1]?.split(',').map((s) => s.trim());
          const row: Record<string, unknown> = {};
          cols?.forEach((col, i) => { row[col] = boundArgs[i]; });
          mailStore.push(row);
        }
        if (sql.startsWith('DELETE FROM mails')) {
          if (sql.includes('user_id = ?') && sql.includes('LIMIT')) {
            const userId = boundArgs[0];
            const limit = boundArgs[1] as number;
            const toDelete = mailStore.filter((m) => m.user_id === userId).slice(0, limit);
            for (const d of toDelete) {
              const idx = mailStore.indexOf(d);
              if (idx >= 0) mailStore.splice(idx, 1);
            }
          }
        }
        if (sql.startsWith('UPDATE users') && sql.includes('total_mail_size')) {
          const userId = boundArgs[boundArgs.length - 1];
          const user = userStore.find((u) => u.id === userId);
          if (user) {
            user.total_mail_size = mailStore
              .filter((m) => m.user_id === userId)
              .reduce((sum, m) => sum + (m.size as number), 0);
          }
        }
        return { success: true };
      },
    };
    return stmt;
  }

  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return createStmt(sql, args);
        },
        // 不带 bind 的调用
        async first() { return null; },
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
    },
    async batch(statements: any[]) {
      for (const stmt of statements) {
        if (stmt && typeof stmt.run === 'function') {
          await stmt.run();
        }
      }
      return { success: true };
    },
    _getMailStore: () => mailStore,
    _getUserStore: () => userStore,
  };

  return {
    DB: db as unknown as D1Database,
    MAX_MAIL_SIZE: '5242880',
    RATE_LIMIT_COUNT: '3',
    RATE_LIMIT_WINDOW: '300',
  };
}

function createMockMessage(to: string, from = 'sender@example.com') {
  return {
    to: [to],
    from,
    raw: new ReadableStream({
      start(controller) {
        const email = [
          `From: ${from}`,
          `To: ${to}`,
          'Subject: Test Subject',
          'Message-ID: <test-msg-001@example.com>',
          '',
          'Hello, this is the email body text.',
        ].join('\r\n');
        controller.enqueue(new TextEncoder().encode(email));
        controller.close();
      },
    }),
    setReject: vi.fn(),
  } as unknown as ForwardableEmailMessage;
}

describe('Email Worker - 邮件接收', () => {
  it('接受发给已注册用户的邮件', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    const message = createMockMessage('alice@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).not.toHaveBeenCalled();
    expect(env.DB._getMailStore().length).toBe(1);
  });

  it('拒绝发给不存在用户的邮件', async () => {
    const env = createMockEnv([]);
    const message = createMockMessage('nobody@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).toHaveBeenCalledWith('User not found');
  });

  it('拒绝发给已冻结用户的邮件', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'frozen', email_enabled: 1 },
    ]);
    const message = createMockMessage('alice@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).toHaveBeenCalledWith('User not found');
  });

  it('拒绝发给邮箱功能关闭用户的邮件', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 0 },
    ]);
    const message = createMockMessage('alice@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).toHaveBeenCalledWith('User not found');
  });

  it('正确提取用户名（大小写不敏感）', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    const message = createMockMessage('ALICE@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it('存储正确的邮件字段', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    const message = createMockMessage('alice@namio.world', 'bob@example.com');
    await worker.email(message, env as any, {} as any);
    const mails = env.DB._getMailStore();
    expect(mails.length).toBe(1);
    expect(mails[0].user_id).toBe(1);
    expect(mails[0].from_address).toBe('bob@example.com');
    expect(mails[0].subject).toBe('Test Subject');
  });

  it('更新用户邮件总大小', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    const message = createMockMessage('alice@namio.world');
    await worker.email(message, env as any, {} as any);
    const user = env.DB._getUserStore().find((u) => u.username === 'alice');
    expect(user?.total_mail_size).toBeGreaterThan(0);
  });

  it('处理空收件人列表', async () => {
    const env = createMockEnv([]);
    const message = {
      to: [],
      from: 'sender@example.com',
      raw: new ReadableStream(),
      setReject: vi.fn(),
    } as unknown as ForwardableEmailMessage;
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).toHaveBeenCalledWith('No recipient');
  });

  it('处理超过 63 字符的用户名', async () => {
    const env = createMockEnv([]);
    const longName = 'a'.repeat(64);
    const message = createMockMessage(`${longName}@namio.world`);
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).toHaveBeenCalledWith('Invalid recipient');
  });
});

describe('Email Worker - 频率限制', () => {
  it('超过频率限制的邮件被静默丢弃', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 0, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    for (let i = 0; i < 3; i++) {
      const message = createMockMessage('alice@namio.world', 'spammer@example.com');
      await worker.email(message, env as any, {} as any);
    }
    const message4 = createMockMessage('alice@namio.world', 'spammer@example.com');
    await worker.email(message4, env as any, {} as any);
    expect(message4.setReject).not.toHaveBeenCalled();
    expect(env.DB._getMailStore().length).toBe(3);
  });
});

describe('Email Worker - 配额清理', () => {
  it('超过配额时触发清理', async () => {
    const env = createMockEnv([
      { id: 1, username: 'alice', total_mail_size: 100 * 1024 * 1024 + 1, forward_email: null, status: 'active', email_enabled: 1 },
    ]);
    env.DB._getMailStore().push(
      { user_id: 1, from_address: 'a@b.com', subject: 'old', body: 'x'.repeat(1000), size: 1000 },
      { user_id: 1, from_address: 'a@b.com', subject: 'old2', body: 'x'.repeat(1000), size: 1000 },
    );
    const message = createMockMessage('alice@namio.world');
    await worker.email(message, env as any, {} as any);
    expect(message.setReject).not.toHaveBeenCalled();
  });
});
