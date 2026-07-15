<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 状态管理
const visible = ref(false);
const scrollY = ref(0);
const mouseX = ref(0);
const mouseY = ref(0);
const activeFeature = ref(0);
const isHovering = ref(false);

// 动态背景渐变
const gradientStyle = computed(() => {
  const x = (mouseX.value / window.innerWidth) * 100;
  const y = (mouseY.value / window.innerHeight) * 100;
  return {
    background: `radial-gradient(circle at ${x}% ${y}%, rgba(79, 70, 229, 0.15) 0%, transparent 50%)`,
  };
});

// 视差效果
const parallaxStyle = computed(() => ({
  transform: `translateY(${scrollY.value * 0.3}px)`,
}));

// 鼠标跟踪
function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}

// 滚动处理
function handleScroll() {
  scrollY.value = window.scrollY;
}

// 特性轮播
let featureInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true; });
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll);

  // 自动轮播特性
  featureInterval = setInterval(() => {
    if (!isHovering.value) {
      activeFeature.value = (activeFeature.value + 1) % 4;
    }
  }, 3000);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', handleScroll);
  clearInterval(featureInterval);
});

// 特性数据
const features = [
  {
    icon: 'globe',
    title: '免费域名',
    subtitle: 'Free Domain',
    desc: '注册即获 username.nomio.world 二级域名',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    stats: '100%',
    statsLabel: '免费',
  },
  {
    icon: 'mail',
    title: '智能邮箱',
    subtitle: 'Smart Email',
    desc: '自动接收、转发、存储，一站式管理',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    stats: '100MB',
    statsLabel: '存储',
  },
  {
    icon: 'zap',
    title: '边缘加速',
    subtitle: 'Edge First',
    desc: '全球 300+ 节点，延迟低于 50ms',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    stats: '<50ms',
    statsLabel: '延迟',
  },
  {
    icon: 'lock',
    title: '安全可靠',
    subtitle: 'Secure',
    desc: 'HTTPS、JWT、PBKDF2 全面防护',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    stats: '100%',
    statsLabel: 'HTTPS',
  },
];

// 步骤数据
const steps = [
  { num: '01', title: '注册', desc: '选择用户名', icon: 'user' },
  { num: '02', title: '配置', desc: '设置源站', icon: 'settings' },
  { num: '03', title: '验证', desc: '证明所有权', icon: 'check' },
  { num: '04', title: '上线', desc: '立即生效', icon: 'rocket' },
];

// 统计数据
const stats = [
  { value: '300+', label: '全球节点', icon: '🌍' },
  { value: '<50ms', label: '响应延迟', icon: 'zap' },
  { value: '193', label: '测试用例', icon: 'check' },
  { value: 'AGPL', label: '开源协议', icon: '📖' },
];
</script>

<template>
  <div class="landing" :class="{ visible }">

    <!-- 动态背景 -->
    <div class="dynamic-bg" :style="gradientStyle"></div>

    <!-- 导航栏 -->
    <header class="nav" :class="{ scrolled: scrollY > 50 }">
      <div class="nav-inner">
        <div class="nav-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">Nomio<span class="logo-dot">.</span>World</span>
        </div>
        <div class="nav-links">
          <a href="#features" class="nav-link">功能</a>
          <a href="#process" class="nav-link">流程</a>
          <a href="#stats" class="nav-link">数据</a>
          <router-link to="/login" class="nav-link">登录</router-link>
          <router-link to="/register" class="nav-cta">
            <span>开始使用</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-orb orb-1"></div>
        <div class="hero-orb orb-2"></div>
        <div class="hero-orb orb-3"></div>
        <div class="hero-grid"></div>
      </div>

      <div class="hero-content" :style="parallaxStyle">
        <div class="hero-badge">
          <span class="badge-pulse"></span>
          <span>开源 · 公益 · 免费</span>
        </div>

        <h1 class="hero-title">
          <span class="title-line">你的数字身份</span>
          <span class="title-line gradient-text">从这里开始</span>
        </h1>

        <p class="hero-desc">
          免费获得 <strong>your-name.nomio.world</strong> 域名和邮箱
        </p>

        <div class="hero-actions">
          <router-link to="/register" class="btn-hero-primary">
            <span>免费注册</span>
            <div class="btn-shine"></div>
          </router-link>
          <a href="#features" class="btn-hero-secondary">
            <span>了解更多</span>
          </a>
        </div>

        <!-- 终端预览 -->
        <div class="terminal-preview">
          <div class="terminal-header">
            <div class="terminal-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span class="terminal-title">~/nomio</span>
          </div>
          <div class="terminal-body">
            <div class="terminal-line">
              <span class="prompt">$</span>
              <span class="command">nomio register alice</span>
            </div>
            <div class="terminal-line success">
              <span class="output">✓ 域名已激活: alice.nomio.world</span>
            </div>
            <div class="terminal-line success">
              <span class="output">✓ 邮箱已就绪: alice@nomio.world</span>
            </div>
            <div class="terminal-line">
              <span class="prompt">$</span>
              <span class="command typing">_</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="scroll-indicator">
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <span>向下滚动</span>
      </div>
    </section>

    <!-- 特性展示 -->
    <section id="features" class="features">
      <div class="section-header">
        <span class="section-tag">FEATURES</span>
        <h2>核心特性</h2>
        <p>一站式数字身份解决方案</p>
      </div>

      <div class="features-grid">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="feature-card"
          :class="{ active: activeFeature === index }"
          :style="{ '--gradient': feature.gradient, '--delay': `${index * 0.1}s` }"
          @mouseenter="activeFeature = index; isHovering = true"
          @mouseleave="isHovering = false"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <div class="feature-content">
            <h3>{{ feature.title }}</h3>
            <span class="feature-subtitle">{{ feature.subtitle }}</span>
            <p>{{ feature.desc }}</p>
          </div>
          <div class="feature-stats">
            <span class="stats-value">{{ feature.stats }}</span>
            <span class="stats-label">{{ feature.statsLabel }}</span>
          </div>
          <div class="feature-glow"></div>
        </div>
      </div>
    </section>

    <!-- 流程展示 -->
    <section id="process" class="process">
      <div class="section-header">
        <span class="section-tag">HOW IT WORKS</span>
        <h2>简单四步</h2>
        <p>快速拥有你的数字身份</p>
      </div>

      <div class="process-timeline">
        <div class="timeline-line"></div>
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="process-step"
          :style="{ '--delay': `${index * 0.15}s` }"
        >
          <div class="step-icon">{{ step.icon }}</div>
          <div class="step-num">{{ step.num }}</div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.desc }}</p>
          <div class="step-connector"></div>
        </div>
      </div>
    </section>

    <!-- 数据展示 -->
    <section id="stats" class="stats-section">
      <div class="stats-bg">
        <div class="stats-gradient"></div>
      </div>
      <div class="stats-content">
        <div class="section-header light">
          <span class="section-tag">STATISTICS</span>
          <h2>数据说话</h2>
        </div>

        <div class="stats-grid">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="stat-item"
            :style="{ '--delay': `${index * 0.1}s` }"
          >
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta-content">
        <h2>准备好开始了吗？</h2>
        <p>免费注册，即刻拥有你的数字身份</p>
        <router-link to="/register" class="btn-cta">
          <span>立即注册</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-logo">
          <span class="logo-icon">✦</span>
          <span>Nomio.World</span>
        </div>
        <p>开源公益数字身份服务</p>
        <div class="footer-links">
          <a href="https://github.com/LemonStudio-hub/nomio-world" target="_blank">GitHub</a>
          <router-link to="/docs">文档</router-link>
          <router-link to="/about">关于</router-link>
        </div>
        <div class="footer-copyright">
          © 2024 Nomio.World · AGPL-3.0
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 基础变量 */
:root {
  --primary: #4f46e5;
  --primary-light: #818cf8;
  --accent: #0ea5e9;
  --gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%);
}

/* Landing 容器 */
.landing {
  min-height: 100vh;
  overflow-x: hidden;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.landing.visible {
  opacity: 1;
}

/* 动态背景 */
.dynamic-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  transition: background 0.3s ease;
}

/* 导航栏 */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 20px 0;
  transition: all 0.3s ease;
}

.nav.scrolled {
  padding: 12px 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text);
}

.logo-icon {
  font-size: 1.5rem;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-dot {
  color: var(--color-primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-cta:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

/* Hero 区域 */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 32px 80px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: rgba(79, 70, 229, 0.2);
  top: -200px;
  right: -100px;
  animation: float1 20s ease-in-out infinite;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: rgba(14, 165, 233, 0.15);
  bottom: -150px;
  left: -100px;
  animation: float2 25s ease-in-out infinite;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: rgba(124, 58, 237, 0.15);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float3 30s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 50px) scale(1.1); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, -50px) scale(1.05); }
}

@keyframes float3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.15); }
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-muted);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 32px;
  animation: fadeInUp 0.6s ease 0.2s both;
}

.badge-pulse {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.hero-title {
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease 0.3s both;
}

.title-line {
  display: block;
}

.gradient-text {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #0ea5e9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradientShift 8s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-desc {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin-bottom: 40px;
  animation: fadeInUp 0.6s ease 0.4s both;
}

.hero-desc strong {
  color: var(--color-primary);
  font-weight: 700;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 64px;
  animation: fadeInUp 0.6s ease 0.5s both;
}

.btn-hero-primary {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--gradient);
  color: white;
  border-radius: var(--radius-full);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.btn-hero-secondary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-hero-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* 终端预览 */
.terminal-preview {
  max-width: 500px;
  margin: 0 auto;
  background: #1e1e2e;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: fadeInUp 0.6s ease 0.6s both;
  transform: perspective(1000px) rotateX(5deg);
  transition: transform 0.3s ease;
}

.terminal-preview:hover {
  transform: perspective(1000px) rotateX(0deg);
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.terminal-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }

.terminal-title {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

.terminal-body {
  padding: 20px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
}

.terminal-line {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.terminal-line:last-child {
  margin-bottom: 0;
}

.prompt {
  color: #a78bfa;
}

.command {
  color: #e2e8f0;
}

.output {
  color: #34d399;
}

.typing {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 滚动指示器 */
.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  animation: fadeInUp 0.6s ease 0.8s both;
}

.scroll-mouse {
  width: 24px;
  height: 36px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
}

.scroll-wheel {
  width: 4px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 2px;
  animation: scrollWheel 2s ease-in-out infinite;
}

@keyframes scrollWheel {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(12px); opacity: 0; }
}

/* 通用动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 特性区域 */
.features {
  position: relative;
  padding: 120px 32px;
  z-index: 1;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.section-header p {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

.section-header.light h2,
.section-header.light p {
  color: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  position: relative;
  padding: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease var(--delay) both;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.feature-card.active {
  border-color: var(--color-primary-muted);
  box-shadow: 0 20px 40px rgba(79, 70, 229, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: bounceIn 0.6s ease var(--delay) both;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.feature-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.feature-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: block;
}

.feature-content p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.feature-stats {
  position: absolute;
  top: 24px;
  right: 24px;
  text-align: right;
}

.stats-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.feature-glow {
  position: absolute;
  bottom: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: var(--gradient);
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.feature-card.active .feature-glow,
.feature-card:hover .feature-glow {
  opacity: 0.15;
}

/* 流程区域 */
.process {
  position: relative;
  padding: 120px 32px;
  background: var(--color-bg);
  z-index: 1;
}

.process-timeline {
  display: flex;
  justify-content: center;
  gap: 48px;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
}

.timeline-line {
  position: absolute;
  top: 60px;
  left: 15%;
  right: 15%;
  height: 2px;
  background: var(--color-border);
}

.process-step {
  flex: 1;
  text-align: center;
  position: relative;
  animation: fadeInUp 0.6s ease var(--delay) both;
}

.step-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: bounceIn 0.6s ease var(--delay) both;
}

.step-num {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.process-step h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.process-step p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 数据区域 */
.stats-section {
  position: relative;
  padding: 120px 32px;
  overflow: hidden;
  z-index: 1;
}

.stats-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%);
}

.stats-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(14, 165, 233, 0.2) 0%, transparent 50%);
}

.stats-content {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.stat-item {
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease var(--delay) both;
}

.stat-item:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

/* CTA 区域 */
.cta {
  position: relative;
  padding: 120px 32px;
  text-align: center;
  z-index: 1;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.cta-content p {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  background: var(--gradient);
  color: white;
  border-radius: var(--radius-full);
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(79, 70, 229, 0.4);
}

/* 页脚 */
.footer {
  position: relative;
  padding: 64px 32px;
  background: var(--color-text);
  color: white;
  z-index: 1;
}

.footer-content {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.footer-logo .logo-icon {
  background: linear-gradient(135deg, #818cf8, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-copyright {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hero {
    padding: 100px 24px 60px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn-hero-primary,
  .btn-hero-secondary {
    width: 100%;
    justify-content: center;
  }

  .terminal-preview {
    transform: none;
  }

  .terminal-preview:hover {
    transform: none;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .process-timeline {
    flex-direction: column;
    gap: 32px;
  }

  .timeline-line {
    display: none;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header h2,
  .cta-content h2 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
