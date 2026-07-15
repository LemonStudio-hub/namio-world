/**
 * Nomio Email Worker
 * 这个文件现在只是一个占位符
 * 实际的邮件处理逻辑在 consumer.ts 中（Queue Consumer）
 * 邮件接收逻辑在 email-handler Worker 中（Queue Producer）
 */

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        service: 'nomio-email',
        note: 'This is the email queue consumer. Emails are processed asynchronously via Cloudflare Queue.',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  },
};
