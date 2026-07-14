/**
 * Namio Email Worker
 * 接收入站邮件，解析纯文本，存储到 D1，可选转发
 */

import PostalMime from 'postal-mime';

interface Env {
  DB: D1Database;
  MAX_MAIL_SIZE?: string;
  RATE_LIMIT_COUNT?: string;
  RATE_LIMIT_WINDOW?: string;
}

interface ParsedMail {
  messageId?: string;
  from?: { address: string; name?: string };
  to?: Array<{ address: string }>;
  subject?: string;
  text?: string;
  html?: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    // 1. 解析收件人，提取用户名
    const recipient = message.to[0];
    if (!recipient) {
      message.setReject('No recipient');
      return;
    }

    const username = recipient.split('@')[0]?.toLowerCase();
    if (!username || username.length > 63) {
      message.setReject('Invalid recipient');
      return;
    }

    // 2. 验证用户是否存在且状态正常
    const user = await env.DB.prepare(
      'SELECT id, total_mail_size, forward_email FROM users WHERE username = ? AND status = ? AND email_enabled = 1',
    )
      .bind(username, 'active')
      .first<{ id: number; total_mail_size: number; forward_email: string | null }>();

    if (!user) {
      message.setReject('User not found');
      return;
    }

    // 3. 检查用户邮箱配额（按总大小限制）
    if (user.total_mail_size >= 100 * 1024 * 1024) {
      await cleanupOldestMails(env.DB, user.id, 0.1);
    }

    // 4. 解析邮件
    const parser = new PostalMime();
    const parsed = (await parser.parse(message.raw)) as ParsedMail;

    // 5. 提取纯文本内容（剥离 HTML 标签与附件）
    const plainText = extractPlainText(parsed.text, parsed.html);

    // 6. 检查单封邮件大小
    const maxSize = parseInt(env.MAX_MAIL_SIZE || '5242880', 10);
    if (plainText.length > maxSize) {
      message.setReject('Message too large');
      return;
    }

    // 7. 频率限制：同一发件人 5 分钟内最多 N 封
    const rateLimit = parseInt(env.RATE_LIMIT_COUNT || '3', 10);
    const rateWindow = parseInt(env.RATE_LIMIT_WINDOW || '300', 10);
    const fromAddress = parsed.from?.address || message.from;

    const isRateLimited = await checkRateLimit(env.DB, user.id, fromAddress, rateLimit, rateWindow);
    if (isRateLimited) {
      return; // 静默丢弃，返回 250
    }

    // 8. 存储到 D1
    const mailSize = new TextEncoder().encode(plainText).length;
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO mails (user_id, message_id, from_address, subject, body, size) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(
        user.id,
        parsed.messageId || crypto.randomUUID(),
        fromAddress,
        parsed.subject || '(无主题)',
        plainText,
        mailSize,
      ),
      env.DB.prepare(
        'UPDATE users SET total_mail_size = total_mail_size + ? WHERE id = ?',
      ).bind(mailSize, user.id),
    ]);

    // 9. 转发至用户配置的外部邮箱（预留接口）
    if (user.forward_email) {
      await forwardToExternal(user.forward_email, parsed, env);
    }
  },
};

// ---- 辅助函数 ----

function extractPlainText(text?: string, html?: string): string {
  if (text) return text.trim();
  if (html) {
    let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  }
  return '';
}

async function checkRateLimit(
  db: D1Database,
  userId: number,
  fromAddress: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const result = await db
    .prepare('SELECT COUNT(*) as cnt FROM mails WHERE user_id = ? AND from_address = ? AND received_at > ?')
    .bind(userId, fromAddress, windowStart)
    .first<{ cnt: number }>();
  return (result?.cnt ?? 0) >= limit;
}

async function cleanupOldestMails(db: D1Database, userId: number, ratio: number): Promise<void> {
  const count = await db
    .prepare('SELECT COUNT(*) as cnt FROM mails WHERE user_id = ?')
    .bind(userId)
    .first<{ cnt: number }>();

  const deleteCount = Math.ceil((count?.cnt ?? 0) * ratio);
  if (deleteCount === 0) return;

  await db
    .prepare('DELETE FROM mails WHERE id IN (SELECT id FROM mails WHERE user_id = ? ORDER BY received_at ASC LIMIT ?)')
    .bind(userId, deleteCount)
    .run();

  await db
    .prepare('UPDATE users SET total_mail_size = (SELECT COALESCE(SUM(size), 0) FROM mails WHERE user_id = ?) WHERE id = ?')
    .bind(userId, userId)
    .run();
}

async function forwardToExternal(
  targetEmail: string,
  parsed: ParsedMail,
  _env: Env,
): Promise<void> {
  // TODO: 对接第三方邮件 API（如 SendGrid / Mailgun）
  console.log(`[Forward] To: ${targetEmail}, Subject: ${parsed.subject}`);
}
