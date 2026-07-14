<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const visible = ref(false);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true; });

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
  );

  document.querySelectorAll('.reveal').forEach((el) => observer!.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
});

const features = [
  {
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    title: '免费二级域名',
    desc: '注册即可获得 username.nomio.world 域名，通过边缘网关反向代理到你的 HTTPS 源站。',
  },
  {
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: '邮箱托管',
    desc: '自动获得 username@nomio.world 邮箱地址，支持接收邮件、自动转发、内置收件箱。',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: '边缘优先',
    desc: '全球 Cloudflare 边缘网络驱动，路由、邮件处理、数据读写均在边缘节点完成。',
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    title: '安全默认',
    desc: '强制 HTTPS 回源，PBKDF2 密码哈希，JWT 认证，频率限制与存储配额。',
  },
];

const steps = [
  { num: '01', title: '注册账号', desc: '选择你的用户名，填写源站地址，一分钟完成注册。' },
  { num: '02', title: '验证源站', desc: '部署验证文件证明源站所有权，防止恶意指向。' },
  { num: '03', title: '开始使用', desc: '域名即时生效，邮箱自动就绪，一切准备就绪。' },
];

const techStack = [
  { name: 'Cloudflare Workers', role: '边缘运行时' },
  { name: 'Hono', role: 'Web 框架' },
  { name: 'Vue 3', role: '前端框架' },
  { name: 'D1', role: '边缘数据库' },
  { name: 'TypeScript', role: '类型安全' },
  { name: 'Vitest', role: '测试框架' },
];
</script>

<template>
  <div class="landing" :class="{ visible }">

    <!-- 导航栏 -->
    <header class="nav">
      <div class="nav-inner">
        <div class="nav-logo"><span>Nomio</span>.World</div>
        <div class="nav-links">
          <a href="#features">功能</a>
          <a href="#how">工作原理</a>
          <a href="#tech">技术栈</a>
          <router-link to="/login">登录</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">注册</router-link>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient g1"></div>
        <div class="hero-gradient g2"></div>
        <div class="hero-gradient g3"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          公益数字身份基建服务
        </div>
        <h1 class="hero-title">
          <span class="line">域名与邮箱的</span>
          <span class="line gradient-text">入口服务</span>
        </h1>
        <p class="hero-desc">
          免费获取二级域名与邮箱地址，基于 Cloudflare 边缘网络，<br />
          全球加速，安全可靠，零运维成本。
        </p>
        <div class="hero-actions">
          <router-link to="/register" class="btn btn-primary btn-lg">
            免费注册
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </router-link>
          <a href="#features" class="btn btn-ghost btn-lg">了解更多</a>
        </div>
        <div class="hero-preview">
          <div class="preview-card">
            <div class="preview-header">
              <span class="preview-dot red"></span>
              <span class="preview-dot yellow"></span>
              <span class="preview-dot green"></span>
            </div>
            <div class="preview-body">
              <div class="preview-line">
                <span class="preview-prompt">$</span>
                <span class="preview-domain">alice</span><span class="preview-tld">.nomio.world</span>
              </div>
              <div class="preview-line">
                <span class="preview-prompt">$</span>
                <span class="preview-at">alice@nomio.world</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section features">
      <div class="section-inner">
        <div class="section-header reveal">
          <div class="section-badge">核心能力</div>
          <h2>简洁而强大的功能</h2>
          <p>我们专注于提供域名与邮箱两大核心能力，做到极致简洁。</p>
        </div>
        <div class="feature-grid">
          <div
            v-for="(f, i) in features"
            :key="i"
            class="feature-card reveal"
            :style="{ '--delay': i * 0.1 + 's' }"
          >
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path :d="f.icon" />
              </svg>
            </div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section how">
      <div class="section-inner">
        <div class="section-header reveal">
          <div class="section-badge">工作原理</div>
          <h2>三步开始使用</h2>
          <p>从注册到生效，只需几分钟。</p>
        </div>
        <div class="steps">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="step reveal"
            :style="{ '--delay': i * 0.15 + 's' }"
          >
            <div class="step-num">{{ s.num }}</div>
            <div class="step-line" v-if="i < steps.length - 1"></div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech Stack -->
    <section id="tech" class="section tech-section">
      <div class="section-inner">
        <div class="section-header reveal">
          <div class="section-badge">技术架构</div>
          <h2>现代技术栈</h2>
          <p>全栈运行于 Cloudflare 边缘网络，极致性能。</p>
        </div>
        <div class="tech-grid">
          <div
            v-for="(t, i) in techStack"
            :key="i"
            class="tech-item reveal"
            :style="{ '--delay': i * 0.08 + 's' }"
          >
            <div class="tech-name">{{ t.name }}</div>
            <div class="tech-role">{{ t.role }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="section stats-section">
      <div class="section-inner">
        <div class="stats-row reveal">
          <div class="stat-item">
            <div class="stat-value">100%</div>
            <div class="stat-label">免费使用</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">300+</div>
            <div class="stat-label">全球边缘节点</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">&lt;50ms</div>
            <div class="stat-label">边缘响应延迟</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">AGPL-3.0</div>
            <div class="stat-label">开源协议</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta">
      <div class="section-inner">
        <div class="cta-card reveal">
          <div class="cta-glow"></div>
          <h2>开始你的数字身份</h2>
          <p>免费注册，即刻获得专属域名与邮箱。</p>
          <router-link to="/register" class="btn btn-primary btn-lg">
            立即注册
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-logo"><span>Nomio</span>.World</div>
          <div class="footer-links">
            <a href="https://github.com/LemonStudio-hub/nomio-world" target="_blank">GitHub</a>
            <router-link to="/login">登录</router-link>
            <router-link to="/register">注册</router-link>
          </div>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-copy">2026 Nomio.World Contributors. AGPL-3.0 License.</div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ---- 入场 ---- */

.landing {
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.landing.visible {
  opacity: 1;
}

/* ---- reveal 动画 ---- */

.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}

/* ---- 导航 ---- */

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.nav-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.nav-logo span { color: var(--color-primary); }
.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}
.nav-links a {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--color-text); }

/* ---- Hero ---- */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 120px 32px 80px;
}
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-gradient {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}
.hero-gradient.g1 {
  top: -20%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%);
  animation: float1 25s ease-in-out infinite;
}
.hero-gradient.g2 {
  bottom: -10%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  animation: float2 30s ease-in-out infinite;
}
.hero-gradient.g3 {
  top: 30%;
  left: 40%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%);
  animation: float3 20s ease-in-out infinite;
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(1.08); }
  66% { transform: translate(20px, -20px) scale(0.95); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -30px) scale(1.1); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-30px, 40px); }
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.025) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 65%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 65%);
}
.hero-content {
  position: relative;
  text-align: center;
  max-width: 720px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(79, 70, 229, 0.06);
  border: 1px solid rgba(79, 70, 229, 0.12);
  margin-bottom: 32px;
  letter-spacing: 0.02em;
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-text);
  letter-spacing: -0.04em;
  margin-bottom: 24px;
}
.hero-title .line {
  display: block;
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}
.gradient-text {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #0ea5e9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both,
             gradientShift 8s ease-in-out infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.hero-desc {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: 40px;
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}
.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 64px;
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}
.hero-preview {
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
}
.preview-card {
  display: inline-block;
  background: #1e1e2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05);
  text-align: left;
  min-width: 340px;
}
.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.preview-dot.red { background: #ff5f57; }
.preview-dot.yellow { background: #febc2e; }
.preview-dot.green { background: #28c840; }
.preview-body {
  padding: 16px 18px;
}
.preview-line {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 2;
}
.preview-prompt {
  color: #a78bfa;
  font-weight: 600;
}
.preview-domain {
  color: #60a5fa;
  font-weight: 600;
}
.preview-tld {
  color: #94a3b8;
}
.preview-at {
  color: #34d399;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---- Section ---- */

.section {
  padding: 120px 32px;
}
.section-inner {
  max-width: 1120px;
  margin: 0 auto;
}
.section-header {
  text-align: center;
  margin-bottom: 64px;
}
.section-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(79, 70, 229, 0.06);
  border: 1px solid rgba(79, 70, 229, 0.12);
  margin-bottom: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.section-header h2 {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.03em;
  margin-bottom: 14px;
}
.section-header p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ---- Features ---- */

.features {
  background: var(--color-bg);
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), #7c3aed);
  opacity: 0;
  transition: opacity 0.3s;
}
.feature-card:hover {
  border-color: transparent;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px) !important;
}
.feature-card:hover::before {
  opacity: 1;
}
.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(79, 70, 229, 0.08);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.3s;
}
.feature-card:hover .feature-icon {
  transform: scale(1.08);
}
.feature-card h3 {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.feature-card p {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.75;
}

/* ---- Steps ---- */

.how {
  background: var(--color-surface);
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  position: relative;
}
.step {
  text-align: center;
  padding: 32px 24px;
  position: relative;
}
.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  font-size: 1.125rem;
  font-weight: 800;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
  position: relative;
  z-index: 1;
}
.step-line {
  position: absolute;
  top: 60px;
  left: calc(50% + 36px);
  width: calc(100% - 72px);
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary-muted), transparent);
  opacity: 0.4;
}
.step h3 {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 10px;
}
.step p {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 240px;
  margin: 0 auto;
}

/* ---- Tech Stack ---- */

.tech-section {
  background: var(--color-bg);
}
.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.tech-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.tech-item:hover {
  border-color: var(--color-primary-muted);
  box-shadow: 0 2px 12px rgba(79, 70, 229, 0.06);
  transform: translateX(4px) !important;
}
.tech-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
}
.tech-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ---- Stats ---- */

.stats-section {
  background: var(--color-surface);
  padding: 80px 32px;
}
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.04em;
  margin-bottom: 6px;
  line-height: 1;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

/* ---- CTA ---- */

.cta {
  background: var(--color-bg);
  padding: 100px 32px;
}
.cta-card {
  text-align: center;
  padding: 72px 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}
.cta-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 300px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%);
  pointer-events: none;
}
.cta-card h2 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.03em;
  margin-bottom: 14px;
  position: relative;
}
.cta-card p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  position: relative;
}
.cta-card .btn {
  position: relative;
}

/* ---- Footer ---- */

.footer {
  background: #0f0f14;
  color: rgba(255, 255, 255, 0.45);
  padding: 0 32px;
}
.footer-inner {
  max-width: 1120px;
  margin: 0 auto;
}
.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 0 24px;
}
.footer-logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}
.footer-logo span { color: rgba(255, 255, 255, 0.6); }
.footer-links {
  display: flex;
  align-items: center;
  gap: 28px;
}
.footer-links a {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.2s;
}
.footer-links a:hover { color: white; }
.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}
.footer-copy {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
  padding: 20px 0;
  text-align: center;
}

/* ---- 按钮 ---- */

.btn-lg {
  padding: 13px 30px;
  font-size: 0.875rem;
  border-radius: 10px;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.btn-ghost:hover {
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

/* ---- 响应式 ---- */

@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
  .hero-desc br { display: none; }
  .feature-grid { grid-template-columns: 1fr; }
  .steps { grid-template-columns: 1fr; gap: 8px; }
  .step-line { display: none; }
  .tech-grid { grid-template-columns: 1fr 1fr; }
  .stats-row { flex-wrap: wrap; gap: 32px; }
  .stat-divider { display: none; }
  .nav-links a:not(.btn) { display: none; }
  .footer-top { flex-direction: column; gap: 16px; }
  .preview-card { min-width: auto; }
}
</style>
