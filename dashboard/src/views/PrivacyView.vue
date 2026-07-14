<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true; });
});
</script>

<template>
  <div class="privacy-page" :class="{ visible }">

    <!-- 导航栏 -->
    <header class="nav">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo"><span>Nomio</span>.World</router-link>
        <div class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/login">登录</router-link>
        </div>
      </div>
    </header>

    <!-- 内容 -->
    <main class="content">
      <div class="content-inner">

        <div class="doc-header">
          <h1>隐私政策</h1>
          <p class="doc-meta">最后更新日期：2026 年 7 月 14 日 &nbsp;|&nbsp; 生效日期：2026 年 7 月 14 日</p>
        </div>

        <div class="doc-body">

          <section>
            <h2>一、引言</h2>
            <p>
              欢迎使用 Nomio.World（以下简称"本服务"或"我们"）。我们深知个人信息对您的重要性，
              并会尽全力保护您的个人信息安全。本隐私政策旨在向您说明我们如何收集、使用、存储、
              共享和保护您的个人信息，以及您享有的相关权利。
            </p>
            <p>
              请您在使用本服务之前，仔细阅读并充分理解本隐私政策的全部内容。如您对本隐私政策
              有任何疑问，可通过本政策末尾提供的联系方式与我们取得联系。
            </p>
          </section>

          <section>
            <h2>二、我们收集的信息</h2>

            <h3>2.1 您主动提供的信息</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>信息类型</th>
                    <th>具体内容</th>
                    <th>收集目的</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>账户信息</td>
                    <td>用户名（子域名前缀）、密码（加密存储）</td>
                    <td>创建和管理您的账户</td>
                  </tr>
                  <tr>
                    <td>域名配置</td>
                    <td>源站 HTTPS 地址、回源 Host 头</td>
                    <td>提供反向代理服务</td>
                  </tr>
                  <tr>
                    <td>邮箱设置</td>
                    <td>外部转发邮箱地址（可选）</td>
                    <td>提供邮件转发功能</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.2 自动收集的信息</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>信息类型</th>
                    <th>具体内容</th>
                    <th>收集目的</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>服务日志</td>
                    <td>IP 地址、请求时间、请求路径、User-Agent</td>
                    <td>服务运维、安全防护、故障排查</td>
                  </tr>
                  <tr>
                    <td>邮件元数据</td>
                    <td>发件人地址、邮件主题、接收时间、邮件大小</td>
                    <td>邮件投递与存储管理</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.3 我们不收集的信息</h3>
            <ul>
              <li>真实姓名、身份证号、电话号码等实名信息</li>
              <li>支付信息、银行卡号等财务信息</li>
              <li>精确地理位置信息</li>
              <li>设备指纹、广告标识符</li>
              <li>第三方网站的 Cookie 或追踪数据</li>
            </ul>
          </section>

          <section>
            <h2>三、信息的使用</h2>
            <p>我们仅将收集的信息用于以下目的：</p>
            <ol>
              <li><strong>提供核心服务：</strong>域名反向代理、邮件接收与存储、用户控制台功能。</li>
              <li><strong>安全防护：</strong>防范滥用、垃圾邮件攻击、恶意指向等安全威胁。</li>
              <li><strong>服务改进：</strong>分析匿名化的使用数据以优化服务质量。</li>
              <li><strong>法律合规：</strong>遵守适用的法律法规要求。</li>
            </ol>
            <p>
              我们承诺：<strong>不会将您的个人信息用于广告投放、用户画像、数据交易或任何与服务无关的商业目的。</strong>
            </p>
          </section>

          <section>
            <h2>四、信息的存储与安全</h2>

            <h3>4.1 数据存储</h3>
            <ul>
              <li>所有数据存储于 Cloudflare D1 数据库（基于 SQLite），分布在 Cloudflare 全球边缘网络。</li>
              <li>密码使用 PBKDF2 算法（SHA-256，100,000 次迭代）加盐哈希存储，我们无法获取您的原始密码。</li>
              <li>会话认证使用 JWT（JSON Web Token），有效期 7 天，存储于 HttpOnly Cookie 中。</li>
            </ul>

            <h3>4.2 数据安全措施</h3>
            <ul>
              <li>全链路 HTTPS 加密传输（用户 ↔ Cloudflare ↔ 源站）。</li>
              <li>API 接口实施 CORS 策略、JWT 认证、速率限制等多层安全防护。</li>
              <li>SQL 参数化查询，防止注入攻击。</li>
              <li>定期安全审计与漏洞扫描。</li>
            </ul>

            <h3>4.3 数据保留期限</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>数据类型</th>
                    <th>保留策略</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>活跃用户数据</td>
                    <td>持续保留，直至用户主动删除账户</td>
                  </tr>
                  <tr>
                    <td>不活跃用户数据</td>
                    <td>90 天未登录后冻结，30 天宽限期后自动删除</td>
                  </tr>
                  <tr>
                    <td>已删除账户数据</td>
                    <td>30 天内可恢复，之后永久删除</td>
                  </tr>
                  <tr>
                    <td>服务日志</td>
                    <td>自动轮转，最长保留 90 天</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>五、信息的共享与披露</h2>
            <p>
              我们不会出售、出租或以其他方式向第三方提供您的个人信息，但以下情形除外：
            </p>
            <ol>
              <li>
                <strong>基础设施服务商：</strong>本服务运行于 Cloudflare 平台，您的数据由 Cloudflare
                代为存储和处理。Cloudflare 作为数据处理方，其对数据的处理受其自身的隐私政策约束。
                详见 <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare 隐私政策</a>。
              </li>
              <li>
                <strong>法律要求：</strong>如因法律法规、法律程序、政府主管部门的要求，我们可能需要披露您的信息。
              </li>
              <li>
                <strong>安全需要：</strong>为保护本服务、其他用户或公众的安全与合法权益，在合理必要的范围内。
              </li>
            </ol>
          </section>

          <section>
            <h2>六、您的权利</h2>
            <p>您对您的个人信息享有以下权利：</p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>权利</th>
                    <th>说明</th>
                    <th>行使方式</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>访问权</td>
                    <td>查看您的账户信息与邮件数据</td>
                    <td>通过用户控制台直接查看</td>
                  </tr>
                  <tr>
                    <td>更正权</td>
                    <td>修改源站地址、转发邮箱等配置</td>
                    <td>通过用户控制台直接修改</td>
                  </tr>
                  <tr>
                    <td>删除权</td>
                    <td>删除单封邮件或整个账户</td>
                    <td>通过用户控制台操作或联系我们</td>
                  </tr>
                  <tr>
                    <td>导出权</td>
                    <td>导出您的邮件数据</td>
                    <td>联系我们申请数据导出</td>
                  </tr>
                  <tr>
                    <td>撤回同意</td>
                    <td>撤回对本隐私政策的同意</td>
                    <td>删除账户即可撤回</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>七、Cookie 与本地存储</h2>
            <p>本服务使用以下类型的 Cookie 和本地存储：</p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>用途</th>
                    <th>有效期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>认证 Cookie</td>
                    <td>维持您的登录状态（JWT Token）</td>
                    <td>7 天</td>
                  </tr>
                  <tr>
                    <td>本地存储</td>
                    <td>存储前端偏好设置</td>
                    <td>持久，直至手动清除</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              我们不使用第三方追踪 Cookie，不进行跨站追踪，不参与广告网络。
            </p>
          </section>

          <section>
            <h2>八、未成年人保护</h2>
            <p>
              本服务不面向 13 岁以下的未成年人提供服务。如果我们发现在未获得可验证的监护人同意的
              情况下收集了 13 岁以下未成年人的个人信息，我们将尽快删除相关数据。如果您认为我们
              可能持有未成年人的信息，请联系我们。
            </p>
          </section>

          <section>
            <h2>九、MSIX 打包应用特别说明</h2>
            <div class="callout callout-info">
              <div class="callout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div class="callout-content">
                <p>
                  <strong>本应用的桌面版本</strong>由传统的 Win32 .exe 程序通过
                  <strong>MSIX Packaging Tool</strong> 打包而成，以提供现代化的安装与更新体验。
                </p>
              </div>
            </div>

            <h3>9.1 关于 runFullTrust 功能声明</h3>
            <p>
              由于本应用最初以传统 Win32 桌面程序开发，为保证其所有原有功能（包括但不限于访问
              文件系统、读写 Windows 注册表、与其他本地应用程序交互等）在 MSIX 打包后能正常运行，
              本应用在打包清单（Package Manifest）中声明了 <code>runFullTrust</code> 功能
              （受限功能 Restricted Capability）。
            </p>
            <p>该功能声明的具体含义：</p>
            <ul>
              <li>
                <strong>完整信任运行：</strong>应用以完整信任（Full Trust）模式运行，而非 UWP
                应用的沙箱模式。这意味着应用拥有与原始 Win32 程序相同的系统访问权限。
              </li>
              <li>
                <strong>文件系统访问：</strong>应用可读写本地文件系统中的文件，包括用户文档、
                应用数据目录及其他受保护位置。
              </li>
              <li>
                <strong>注册表访问：</strong>应用可读写 Windows 注册表，用于存储配置信息或
                与其他软件交互。
              </li>
              <li>
                <strong>进程交互：</strong>应用可与系统中的其他进程进行交互，包括启动子进程、
                管道通信等。
              </li>
            </ul>

            <h3>9.2 为什么需要 runFullTrust</h3>
            <p>
              本应用在被打包为 MSIX 格式之前，是一个以传统方式开发的 Win32 桌面程序。为了确保
              打包后的应用能够：
            </p>
            <ul>
              <li>继续访问其正常运行所必需的文件系统路径</li>
              <li>维持与 Windows 注册表的读写交互</li>
              <li>保持与系统中其他应用程序的兼容性</li>
              <li>执行原有的所有功能而不受 MSIX 沙箱限制</li>
            </ul>
            <p>
              因此，我们声明了 <code>runFullTrust</code> 受限功能。我们承诺，此权限仅用于维持
              应用的原有功能，不会用于任何超出应用正常运行所需的系统操作。
            </p>

            <h3>9.3 MSIX 打包应用的数据处理</h3>
            <p>
              MSIX 打包版本在数据处理方面与网页版本完全一致。桌面应用本身不额外收集任何个人信息。
              所有与服务端的通信均通过 HTTPS 加密传输，遵循与本隐私政策其他部分相同的规则。
            </p>
          </section>

          <section>
            <h2>十、第三方服务</h2>
            <p>本服务依赖以下第三方基础设施：</p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>服务商</th>
                    <th>用途</th>
                    <th>隐私政策</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cloudflare</td>
                    <td>边缘计算、数据存储、CDN、邮件路由</td>
                    <td><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">查看</a></td>
                  </tr>
                  <tr>
                    <td>GitHub</td>
                    <td>源代码托管、CI/CD</td>
                    <td><a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">查看</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>十一、隐私政策的变更</h2>
            <p>
              我们可能会不时修订本隐私政策。当政策发生重大变更时，我们将通过以下方式通知您：
            </p>
            <ul>
              <li>在本服务的用户控制台发布通知</li>
              <li>更新本页面顶部的"最后更新日期"</li>
              <li>通过注册时提供的转发邮箱发送通知（如适用）</li>
            </ul>
            <p>
              重大变更包括但不限于：数据收集范围的扩大、数据使用目的的变更、用户权利的限制等。
              继续使用本服务即表示您接受修订后的隐私政策。
            </p>
          </section>

          <section>
            <h2>十二、适用法律与争议解决</h2>
            <p>
              本隐私政策的解释、执行及争议解决均适用中华人民共和国法律。如双方就本隐私政策的
              内容或执行产生任何争议，应首先通过友好协商解决；协商不成的，任何一方均可向有管辖权
              的人民法院提起诉讼。
            </p>
          </section>

          <section>
            <h2>十三、联系我们</h2>
            <p>如您对本隐私政策有任何疑问、意见或建议，或需要行使您的数据权利，请通过以下方式联系我们：</p>
            <ul>
              <li><strong>GitHub：</strong><a href="https://github.com/LemonStudio-hub/nomio-world" target="_blank" rel="noopener">LemonStudio-hub/nomio-world</a>（提交 Issue）</li>
              <li><strong>邮箱：</strong>通过本服务注册的邮箱地址联系管理员</li>
            </ul>
            <p>我们将在收到您的请求后 15 个工作日内予以回复。</p>
          </section>

        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-copy">2026 Nomio.World Contributors. AGPL-3.0 License.</div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.privacy-page {
  opacity: 0;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  background: var(--color-bg);
}
.privacy-page.visible {
  opacity: 1;
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
  text-decoration: none;
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
  text-decoration: none;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--color-text); }

/* ---- 内容 ---- */

.content {
  padding-top: 100px;
  padding-bottom: 80px;
}
.content-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 32px;
}

.doc-header {
  margin-bottom: 48px;
}
.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}
.doc-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* ---- 文档正文 ---- */

.doc-body section {
  margin-bottom: 48px;
}
.doc-body h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}
.doc-body h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 28px;
  margin-bottom: 12px;
}
.doc-body p {
  font-size: 0.9375rem;
  line-height: 1.85;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
}
.doc-body ul, .doc-body ol {
  padding-left: 24px;
  margin-bottom: 14px;
}
.doc-body li {
  font-size: 0.9375rem;
  line-height: 1.85;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.doc-body strong {
  color: var(--color-text);
  font-weight: 600;
}
.doc-body a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 0.2s;
}
.doc-body a:hover { opacity: 0.7; }
.doc-body code {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.85em;
  background: rgba(79, 70, 229, 0.06);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ---- 表格 ---- */

.table-wrap {
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
thead {
  background: var(--color-surface);
}
th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
td {
  padding: 12px 16px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  line-height: 1.6;
}
tr:last-child td {
  border-bottom: none;
}

/* ---- Callout ---- */

.callout {
  display: flex;
  gap: 14px;
  padding: 20px 24px;
  border-radius: 12px;
  margin: 20px 0;
}
.callout-info {
  background: rgba(79, 70, 229, 0.04);
  border: 1px solid rgba(79, 70, 229, 0.12);
}
.callout-icon {
  flex-shrink: 0;
  color: var(--color-primary);
  margin-top: 2px;
}
.callout-content p {
  margin-bottom: 0;
}

/* ---- Footer ---- */

.footer {
  background: #0f0f14;
  color: rgba(255, 255, 255, 0.45);
  padding: 24px 32px;
}
.footer-inner {
  max-width: 800px;
  margin: 0 auto;
}
.footer-copy {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
}

/* ---- 响应式 ---- */

@media (max-width: 768px) {
  .content-inner { padding: 0 20px; }
  .doc-header h1 { font-size: 1.75rem; }
  .doc-body h2 { font-size: 1.25rem; }
  .nav-inner { padding: 0 20px; }
}
</style>
