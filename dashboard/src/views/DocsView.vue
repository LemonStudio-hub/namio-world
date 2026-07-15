<script setup lang="ts">
import { ref } from 'vue';

const activeSection = ref('quickstart');

const sections = [
  { id: 'quickstart', title: '快速开始' },
  { id: 'domain', title: '域名配置' },
  { id: 'email', title: '邮箱使用' },
  { id: 'verify', title: '源站验证' },
  { id: 'faq', title: '常见问题' },
];

const faqs = [
  {
    q: '域名多久生效？',
    a: '注册成功后域名立即生效。Cloudflare DNS 全球传播通常在几分钟内完成。',
  },
  {
    q: '支持哪些源站？',
    a: '支持任何支持 HTTPS 的源站，包括 Vercel、Netlify、GitHub Pages、自有服务器等。不支持 IP 地址。',
  },
  {
    q: '邮箱可以发送邮件吗？',
    a: '当前版本仅支持接收邮件，不支持发送。你可以在 Gmail 等客户端中设置"以该地址代发"。',
  },
  {
    q: '邮件存储有容量限制吗？',
    a: '每个用户有 100MB 的邮件存储配额。超出后自动删除最早的邮件。',
  },
  {
    q: '如何转发邮件到其他邮箱？',
    a: '在邮箱设置中填写转发邮箱地址，收到的邮件将自动转发到该邮箱。',
  },
  {
    q: '域名可以自定义吗？',
    a: '当前仅支持 *.namio.world 子域名。自定义域名支持计划在未来版本中提供。',
  },
];
</script>

<template>
  <div>
    <div class="page-header">
      <h1>帮助文档</h1>
      <p>了解如何使用 Namio.World 的各项功能</p>
    </div>

    <div class="docs-layout">
      <!-- 侧边导航 -->
      <aside class="docs-nav">
        <a
          v-for="s in sections"
          :key="s.id"
          class="docs-nav-item"
          :class="{ active: activeSection === s.id }"
          @click="activeSection = s.id"
        >
          {{ s.title }}
        </a>
      </aside>

      <!-- 内容区 -->
      <div class="docs-content">
        <!-- 快速开始 -->
        <section v-if="activeSection === 'quickstart'" class="docs-section">
          <h2>快速开始</h2>
          <p>只需三步即可开始使用 Namio.World：</p>
          <div class="step-list">
            <div class="doc-step">
              <div class="doc-step-num">1</div>
              <div>
                <h3>注册账号</h3>
                <p>访问注册页面，选择用户名（将作为你的二级域名前缀），填写源站 HTTPS 地址，设置密码。</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">2</div>
              <div>
                <h3>验证源站</h3>
                <p>在你的源站部署验证文件，证明你对该域名的所有权。验证文件路径和内容在域名管理页面查看。</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">3</div>
              <div>
                <h3>开始使用</h3>
                <p>验证通过后，你的域名立即生效。同时你会自动获得一个 @namio.world 的邮箱地址。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 域名配置 -->
        <section v-if="activeSection === 'domain'" class="docs-section">
          <h2>域名配置</h2>
          <h3>源站地址</h3>
          <p>源站地址是你网站的实际托管地址，必须满足以下条件：</p>
          <ul>
            <li>必须以 <code>https://</code> 开头</li>
            <li>不支持 IP 地址</li>
            <li>源站必须有效响应 HTTPS 请求</li>
          </ul>
          <h3>回源 Host</h3>
          <p>回源 Host 头会替换为你填写的值。如果你的源站绑定了自定义域名，在此填写该域名。留空则自动使用源站地址的域名。</p>
          <h3>工作原理</h3>
          <p>当用户访问 <code>alice.namio.world</code> 时：</p>
          <ol>
            <li>DNS 解析到 Cloudflare 边缘节点</li>
            <li>Gateway Worker 提取子域名 <code>alice</code></li>
            <li>查询 D1 数据库获取源站地址</li>
            <li>将请求转发到源站，重写 Host 头</li>
            <li>透传响应，注入安全头</li>
          </ol>
        </section>

        <!-- 邮箱使用 -->
        <section v-if="activeSection === 'email'" class="docs-section">
          <h2>邮箱使用</h2>
          <h3>接收邮件</h3>
          <p>注册后你自动获得 <code>用户名@namio.world</code> 邮箱地址。任何发送到该地址的邮件都会被接收并存储。</p>
          <h3>邮件转发</h3>
          <p>在邮箱设置中可以配置转发邮箱。开启后，收到的邮件会同时转发到你指定的外部邮箱（如 Gmail）。</p>
          <h3>存储限制</h3>
          <p>每个用户的邮件存储配额为 100MB。当用量接近上限时，系统会自动删除最早的邮件以腾出空间。</p>
          <h3>安全机制</h3>
          <ul>
            <li>单封邮件最大 5MB</li>
            <li>同一发件人 5 分钟内最多 3 封</li>
            <li>连续 90 天未登录将冻结邮箱</li>
          </ul>
        </section>

        <!-- 源站验证 -->
        <section v-if="activeSection === 'verify'" class="docs-section">
          <h2>源站验证</h2>
          <p>为防止恶意用户将域名指向他人网站，注册后需要验证源站所有权。</p>
          <h3>验证步骤</h3>
          <ol>
            <li>在域名管理页面查看验证文件路径和内容</li>
            <li>在源站创建文件 <code>/.well-known/namio-verify.txt</code></li>
            <li>文件内容为页面显示的验证 Token</li>
            <li>点击"验证源站"按钮</li>
          </ol>
          <h3>验证失败？</h3>
          <ul>
            <li>确保文件可通过 HTTPS 访问</li>
            <li>确保文件内容完全匹配（无多余空格或换行）</li>
            <li>确保源站没有重定向该路径</li>
          </ul>
        </section>

        <!-- 常见问题 -->
        <section v-if="activeSection === 'faq'" class="docs-section">
          <h2>常见问题</h2>
          <div class="faq-list">
            <div v-for="(faq, i) in faqs" :key="i" class="faq-item">
              <h3>{{ faq.q }}</h3>
              <p>{{ faq.a }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.docs-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.docs-nav {
  width: 180px;
  flex-shrink: 0;
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.docs-nav-item {
  padding: 8px 14px;
  border-radius: var(--radius);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.docs-nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.docs-nav-item:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateX(4px);
}

.docs-nav-item:hover::before {
  transform: scaleY(1);
}

.docs-nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.docs-nav-item.active::before {
  transform: scaleY(1);
}
.docs-content {
  flex: 1;
  min-width: 0;
}
.docs-section h2 {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}
.docs-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 24px 0 8px;
}
.docs-section p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 8px;
}
.docs-section ul,
.docs-section ol {
  padding-left: 20px;
  margin-bottom: 12px;
}
.docs-section li {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 4px;
}
.docs-section code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-primary);
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}
.doc-step {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s var(--ease);
  animation-fill-mode: both;
}

.doc-step:nth-child(1) { animation-delay: 0.1s; }
.doc-step:nth-child(2) { animation-delay: 0.2s; }
.doc-step:nth-child(3) { animation-delay: 0.3s; }

.doc-step:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
}

.doc-step-num {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 800;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.doc-step:hover .doc-step-num {
  transform: scale(1.1);
}
.doc-step h3 {
  font-size: 0.9375rem;
  margin: 0 0 4px;
}
.doc-step p {
  margin: 0;
  font-size: 0.8125rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.faq-item {
  padding: 20px;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s var(--ease);
  animation-fill-mode: both;
}

.faq-item:nth-child(1) { animation-delay: 0.1s; }
.faq-item:nth-child(2) { animation-delay: 0.15s; }
.faq-item:nth-child(3) { animation-delay: 0.2s; }
.faq-item:nth-child(4) { animation-delay: 0.25s; }
.faq-item:nth-child(5) { animation-delay: 0.3s; }
.faq-item:nth-child(6) { animation-delay: 0.35s; }

.faq-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
}

.faq-item h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px;
}
.faq-item p {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
}

@media (max-width: 768px) {
  .docs-layout {
    flex-direction: column;
  }
  .docs-nav {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }
}
</style>
