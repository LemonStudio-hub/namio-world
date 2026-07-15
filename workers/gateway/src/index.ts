/**
 * Nomio Gateway Worker
 * Hono 反向代理网关：将子域名请求转发到用户源站
 * 支持SEO注入，在HTML页面底部注入nomio.world链接
 */

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

// SEO 文案变体
const SEO_VARIANTS: Record<string, { text: string; link: string }> = {
  default: {
    text: '由',
    link: 'Nomio.World 提供域名服务',
  },
  minimal: {
    text: '',
    link: 'Nomio.World',
  },
  branded: {
    text: '数字身份由',
    link: 'Nomio.World 提供',
  },
  friendly: {
    text: '免费域名由',
    link: 'Nomio.World 慷慨提供',
  },
};

// 生成SEO注入HTML
function generateSeoHtml(
  username: string,
  variant: string,
  customText: string | null,
  position: string,
  customStyle: string | null
): string {
  const seoContent = customText || SEO_VARIANTS[variant]?.text || SEO_VARIANTS.default.text;
  const seoLink = SEO_VARIANTS[variant]?.link || SEO_VARIANTS.default.link;

  // 位置样式
  let positionStyle = '';
  switch (position) {
    case 'bottom-left':
      positionStyle = 'left: 24px; bottom: 24px;';
      break;
    case 'bottom-center':
      positionStyle = 'left: 50%; bottom: 24px; transform: translateX(-50%);';
      break;
    case 'bottom-right':
    default:
      positionStyle = 'right: 24px; bottom: 24px;';
      break;
  }

  // 默认样式
  const defaultStyle = `
    .nomio-seo-badge {
      position: fixed;
      ${positionStyle}
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      text-decoration: none;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.8;
      user-select: none;
    }
    .nomio-seo-badge:hover {
      opacity: 1;
      box-shadow: 0 4px 20px rgba(79, 70, 229, 0.15);
      border-color: rgba(79, 70, 229, 0.2);
      transform: translateY(-2px);
    }
    .nomio-seo-badge .nomio-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 6px;
      color: white;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .nomio-seo-badge .nomio-text {
      color: #475569;
    }
    .nomio-seo-badge .nomio-link {
      color: #4f46e5;
      font-weight: 600;
      text-decoration: none;
    }
    .nomio-seo-badge .nomio-link:hover {
      text-decoration: underline;
    }
    @media (prefers-color-scheme: dark) {
      .nomio-seo-badge {
        background: rgba(15, 23, 42, 0.95);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
      }
      .nomio-seo-badge .nomio-text {
        color: #94a3b8;
      }
      .nomio-seo-badge .nomio-link {
        color: #818cf8;
      }
    }
  `;

  const style = customStyle || defaultStyle;

  return `
<!-- Nomio.World SEO Badge -->
<style>${style}</style>
<a href="https://nomio.world?ref=${username}" target="_blank" rel="noopener noreferrer" class="nomio-seo-badge">
  <span class="nomio-logo">N</span>
  <span class="nomio-text">${seoContent}</span>
  <span class="nomio-link">${seoLink}</span>
</a>
<!-- End Nomio.World SEO Badge -->
`;
}

const app = new Hono<{ Bindings: Env }>();

// 通配路由：处理所有子域名请求
app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname;
  const subdomain = hostname.split('.')[0];

  // 1. 基本格式校验
  if (!subdomain || subdomain.length > 63) {
    return c.text('无效的域名', 400);
  }

  // 2. 从 D1 查询用户配置（包含SEO设置）
  const user = await c.env.DB.prepare(
    `SELECT origin_url, origin_host, seo_enabled, seo_variant, seo_custom_text, seo_custom_style, seo_position
     FROM users WHERE username = ? AND status = ?`
  )
    .bind(subdomain, 'active')
    .first<{
      origin_url: string;
      origin_host: string;
      seo_enabled: number;
      seo_variant: string;
      seo_custom_text: string | null;
      seo_custom_style: string | null;
      seo_position: string;
    }>();

  if (!user) {
    return c.text('域名未注册或已停用', 404);
  }

  // 3. 强制 HTTPS 回源校验
  if (!user.origin_url.startsWith('https://')) {
    return c.text('源站配置错误：必须使用 HTTPS', 502);
  }

  // 4. 构造回源请求
  const originUrl = new URL(user.origin_url);
  const targetUrl = `${originUrl.origin}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set('Host', user.origin_host || originUrl.hostname);
  headers.set('X-Forwarded-For', c.req.header('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Real-IP', c.req.header('CF-Connecting-IP') || '');

  // 5. 发起回源请求（AbortController 控制超时）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    // 6. 透传响应，注入安全头
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');

    // 7. 检查是否需要注入SEO HTML
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const shouldInjectSeo = isHtml && user.seo_enabled === 1;

    if (shouldInjectSeo) {
      // 读取响应体
      const html = await response.text();

      // 生成SEO注入HTML
      const seoHtml = generateSeoHtml(
        subdomain,
        user.seo_variant,
        user.seo_custom_text,
        user.seo_position,
        user.seo_custom_style
      );

      // 在 </body> 前注入
      const modifiedHtml = html.replace('</body>', `${seoHtml}</body>`);

      // 返回修改后的响应
      return new Response(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    // 不需要注入，直接返回
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return c.text('源站响应超时', 504);
    }
    return c.text('源站连接失败', 502);
  }
});

export default app;
