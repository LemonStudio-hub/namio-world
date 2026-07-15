/**
 * Email Handler Worker (Producer)
 * 接收入站邮件，验证用户，推送到Queue
 */

import PostalMime from 'postal-mime';

interface Env {
  DB: D1Database;
  QUEUE: Queue;
  MAX_MAIL_SIZE?: string;
}

interface ParsedMail {
  messageId?: string;
  from?: { address: string; name?: string };
  to?: Array<{ address: string }>;
  subject?: string;
  text?: string;
  html?: string;
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
      'SELECT id, total_mail_size FROM users WHERE username = ? AND status = ? AND email_enabled = 1'
    )
      .bind(username, 'active')
      .first<{ id: number; total_mail_size: number }>();

    if (!user) {
      message.setReject('User not found');
      return;
    }

    // 3. 检查用户邮箱配额
    if (user.total_mail_size >= 100 * 1024 * 1024) {
      // 配额已满，仍然接收但会在Consumer中处理清理
      console.warn(`[Email Handler] User ${username} quota exceeded, will cleanup in consumer`);
    }

    // 4. 解析邮件
    const parser = new PostalMime();
    const parsed = (await parser.parse(message.raw)) as ParsedMail;

    // 5. 提取内容
    const plainText = extractPlainText(parsed.text, parsed.html);
    const htmlBody = parsed.html || null;

    // 6. 检查单封邮件大小
    const maxSize = parseInt(env.MAX_MAIL_SIZE || '5242880', 10);
    if (plainText.length > maxSize) {
      message.setReject('Message too large');
      return;
    }

    // 7. 构造Queue消息
    const mailSize = new TextEncoder().encode(plainText).length;
    const fromAddress = parsed.from?.address || message.from;
    const toAddress = parsed.to?.[0]?.address || recipient;

    const queueMessage: EmailQueueMessage = {
      userId: user.id,
      messageId: parsed.messageId || crypto.randomUUID(),
      fromAddress,
      toAddress,
      subject: parsed.subject || '(无主题)',
      body: plainText,
      htmlBody,
      size: mailSize,
      receivedAt: new Date().toISOString(),
    };

    // 8. 推送到Queue
    try {
      await env.QUEUE.send(queueMessage, {
        contentType: 'json',
      });
      console.log(`[Email Handler] Queued email for ${username}: ${queueMessage.subject}`);
    } catch (err) {
      console.error('[Email Handler] Failed to queue email:', err);
      // Queue失败时直接拒绝，让发送方重试
      message.setReject('Temporary failure');
      return;
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
