<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  requestAnimationFrame(() => { visible.value = true; });
});

const values = [
  { title: '开源透明', desc: '代码完全开源，AGPL-3.0 协议。任何人都可以审计、贡献和分叉。' },
  { title: '边缘优先', desc: '全栈运行于 Cloudflare 边缘网络，全球 300+ 节点，延迟低于 50ms。' },
  { title: '零成本', desc: '充分利用 Cloudflare 免费额度，对个人用户完全免费。' },
  { title: '安全默认', desc: '强制 HTTPS、PBKDF2 哈希、JWT 认证，安全机制开箱即用。' },
];

const techs = [
  { name: 'Cloudflare Workers', desc: '边缘计算运行时', category: '基础设施' },
  { name: 'Cloudflare D1', desc: '边缘 SQLite 数据库', category: '基础设施' },
  { name: 'Hono', desc: '轻量级 Web 框架', category: '后端' },
  { name: 'TypeScript', desc: '类型安全', category: '后端' },
  { name: 'Vue 3', desc: '响应式前端框架', category: '前端' },
  { name: 'Vite', desc: '下一代构建工具', category: '前端' },
  { name: 'Pinia', desc: '状态管理', category: '前端' },
  { name: 'Vitest', desc: '测试框架', category: '工程' },
  { name: 'ESLint', desc: '代码规范', category: '工程' },
  { name: 'Prettier', desc: '代码格式化', category: '工程' },
];
</script>

<template>
  <div class="about" :class="{ visible }">
    <div class="page-header">
      <h1>关于</h1>
      <p>Namio.World 项目介绍与技术架构</p>
    </div>

    <!-- 项目简介 -->
    <div class="card reveal">
      <div class="card-title">项目简介</div>
      <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.8">
        Namio.World 是一个基于 Cloudflare 边缘计算平台的公益数字身份基建服务。
        名称取自 <strong>Name + I/O</strong>，寓意"域名与邮箱的入口服务"。
        项目采用 AGPL-3.0 开源协议，所有代码完全公开透明。
      </p>
      <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.8; margin-top: 8px">
        我们相信，域名和邮箱是数字世界最基本的身份标识。每个人都应该能够免费获得一个属于自己的域名和邮箱地址。
      </p>
    </div>

    <!-- 核心价值 -->
    <div class="card reveal">
      <div class="card-title">核心价值</div>
      <div class="values-grid">
        <div v-for="(v, i) in values" :key="i" class="value-item">
          <h3>{{ v.title }}</h3>
          <p>{{ v.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 技术架构 -->
    <div class="card reveal">
      <div class="card-title">技术架构</div>
      <div class="tech-list">
        <div v-for="(t, i) in techs" :key="i" class="tech-row">
          <div class="tech-info">
            <span class="tech-name">{{ t.name }}</span>
            <span class="tech-desc">{{ t.desc }}</span>
          </div>
          <span class="tech-cat">{{ t.category }}</span>
        </div>
      </div>
    </div>

    <!-- 开源 -->
    <div class="card reveal">
      <div class="card-title">开源</div>
      <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.8; margin-bottom: 16px">
        本项目采用 GNU Affero General Public License v3.0 开源。
        如果你修改代码并通过网络提供服务，需要公开修改后的源代码。
      </p>
      <a href="https://github.com/LemonStudio-hub/namio-world" target="_blank" class="btn btn-outline">
        GitHub 仓库
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
    </div>

    <!-- 版本 -->
    <div class="card reveal">
      <div class="card-title">版本信息</div>
      <table>
        <tbody>
          <tr>
            <td class="label-cell">当前版本</td>
            <td>1.0.0</td>
          </tr>
          <tr>
            <td class="label-cell">发布日期</td>
            <td>2026-07-14</td>
          </tr>
          <tr>
            <td class="label-cell">开源协议</td>
            <td>AGPL-3.0</td>
          </tr>
          <tr>
            <td class="label-cell">测试用例</td>
            <td>193 项全部通过</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.about {
  opacity: 0;
  transition: opacity 0.6s ease;
}
.about.visible { opacity: 1; }

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal:nth-child(1) { transition-delay: 0.1s; }
.reveal:nth-child(2) { transition-delay: 0.2s; }
.reveal:nth-child(3) { transition-delay: 0.3s; }
.reveal:nth-child(4) { transition-delay: 0.4s; }
.reveal:nth-child(5) { transition-delay: 0.5s; }

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.value-item {
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.value-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
}

.value-item h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}
.value-item p {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.tech-list {
  display: flex;
  flex-direction: column;
}
.tech-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-light);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tech-row:hover {
  transform: translateX(4px);
  background: var(--color-primary-soft);
  padding-left: 8px;
  border-radius: var(--radius);
}

.tech-row:last-child { border-bottom: none; }
.tech-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  min-width: 160px;
}
.tech-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.tech-cat {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 2px 10px;
  border-radius: 999px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tech-row:hover .tech-cat {
  background: var(--color-primary);
  color: white;
}

.label-cell {
  width: 100px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .values-grid { grid-template-columns: 1fr; }
}
</style>
