/**
 * Email Queue Consumer
 * 从Queue中消费邮件消息，执行频率限制检查，写入D1
 */

interface Env {
  DB: D1Database;
  RATE_LIMIT_COUNT?: string;
  RATE_LIMIT_WINDOW?: string;
}

// Queue消息格式
interface EmailQueueMessage {
  userId: number;
  messageId: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  size: number;
  receivedAt: string;
}

export default {
  async queue(batch: MessageBatch<EmailQueueMessage>, env: Env): Promise<void> {
    const messages = batch.messages;
    console.log(`[Email Consumer] Processing ${messages.length} messages`);

    for (const message of messages) {
      try {
        await processEmail(message.body, env);
        message.ack();
        console.log(`[Email Consumer] Processed: ${message.body.subject}`);
      } catch (err) {
        console.error(`[Email Consumer] Failed to process message:`, err);
        // 重试消息
        message.retry();
      }
    }
  },
};

async function processEmail(email: EmailQueueMessage, env: Env): Promise<void> {
  // 1. 检查用户邮箱配额
  const user = await env.DB.prepare(
    'SELECT id, total_mail_size FROM users WHERE id = ?'
  )
    .bind(email.userId)
    .first<{ id: number; total_mail_size: number }>();

  if (!user) {
    console.warn(`[Email Consumer] User ${email.userId} not found, skipping`);
    return;
  }

  // 2. 配额检查和清理
  if (user.total_mail_size >= 100 * 1024 * 1024) {
    await cleanupOldestMails(env.DB, user.id, 0.1);
  }

  // 3. 频率限制检查
  const rateLimit = parseInt(env.RATE_LIMIT_COUNT || '3', 10);
  const rateWindow = parseInt(env.RATE_LIMIT_WINDOW || '300', 10);

  const isRateLimited = await checkRateLimit(
    env.DB,
    email.userId,
    email.fromAddress,
    rateLimit,
    rateWindow
  );

  if (isRateLimited) {
    console.warn(`[Email Consumer] Rate limited for ${email.fromAddress} -> user ${email.userId}`);
    return; // 静默丢弃
  }

  // 4. 写入D1
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO mails (user_id, message_id, from_address, to_address, subject, body, html_body, size, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      email.userId,
      email.messageId,
      email.fromAddress,
      email.toAddress,
      email.subject,
      email.body,
      email.htmlBody,
      email.size,
      email.receivedAt
    ),
    env.DB.prepare(
      'UPDATE users SET total_mail_size = total_mail_size + ? WHERE id = ?'
    ).bind(email.size, email.userId),
  ]);

  console.log(`[Email Consumer] Stored email: ${email.subject} (${email.size} bytes)`);
}

async function checkRateLimit(
  db: D1Database,
  userId: number,
  fromAddress: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const result = await db
    .prepare(
      'SELECT COUNT(*) as cnt FROM mails WHERE user_id = ? AND from_address = ? AND received_at > ?'
    )
    .bind(userId, fromAddress, windowStart)
    .first<{ cnt: number }>();
  return (result?.cnt ?? 0) >= limit;
}

async function cleanupOldestMails(
  db: D1Database,
  userId: number,
  ratio: number
): Promise<void> {
  const count = await db
    .prepare('SELECT COUNT(*) as cnt FROM mails WHERE user_id = ?')
    .bind(userId)
    .first<{ cnt: number }>();

  const deleteCount = Math.ceil((count?.cnt ?? 0) * ratio);
  if (deleteCount === 0) return;

  await db
    .prepare(
      'DELETE FROM mails WHERE id IN (SELECT id FROM mails WHERE user_id = ? ORDER BY received_at ASC LIMIT ?)'
    )
    .bind(userId, deleteCount)
    .run();

  await db
    .prepare(
      'UPDATE users SET total_mail_size = (SELECT COALESCE(SUM(size), 0) FROM mails WHERE user_id = ?) WHERE id = ?'
    )
    .bind(userId, userId)
    .run();

  console.log(`[Email Consumer] Cleaned up ${deleteCount} old mails for user ${userId}`);
}
