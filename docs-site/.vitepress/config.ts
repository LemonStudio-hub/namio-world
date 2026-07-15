import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Nomio.World',
  description: 'Open Source Public Digital Identity Service',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    ['meta', { name: 'theme-color', content: '#4f46e5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Nomio.World' }],
    ['meta', { property: 'og:description', content: 'Open Source Public Digital Identity Service' }],
  ],

  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      title: 'Nomio.World',
      description: '开源公益数字身份服务',
      themeConfig: {
        nav: [
          { text: '指南', link: '/guide/', activeMatch: '/guide/' },
          { text: 'API', link: '/api/', activeMatch: '/api/' },
          { text: '部署', link: '/deploy/', activeMatch: '/deploy/' },
          {
            text: 'v1.0.0',
            items: [
              { text: '更新日志', link: '/changelog' },
              { text: '贡献指南', link: '/contributing' },
            ],
          },
        ],
        sidebar: {
          '/guide/': [
            {
              text: '入门',
              collapsed: false,
              items: [
                { text: '简介', link: '/guide/' },
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '注册账号', link: '/guide/register' },
                { text: '配置域名', link: '/guide/domain' },
                { text: '使用邮箱', link: '/guide/email' },
              ],
            },
            {
              text: '进阶',
              collapsed: false,
              items: [
                { text: '源站验证', link: '/guide/verification' },
                { text: '邮件转发', link: '/guide/forwarding' },
                { text: '安全设置', link: '/guide/security' },
                { text: '常见问题', link: '/guide/faq' },
              ],
            },
          ],
          '/api/': [
            {
              text: 'API 文档',
              collapsed: false,
              items: [
                { text: '概览', link: '/api/' },
                { text: '认证', link: '/api/auth' },
                { text: '域名', link: '/api/domains' },
                { text: '邮箱', link: '/api/mails' },
                { text: '设置', link: '/api/settings' },
              ],
            },
          ],
          '/deploy/': [
            {
              text: '部署指南',
              collapsed: false,
              items: [
                { text: '概览', link: '/deploy/' },
                { text: 'Workers 部署', link: '/deploy/workers' },
                { text: 'Dashboard 部署', link: '/deploy/dashboard' },
                { text: 'DNS 配置', link: '/deploy/dns' },
                { text: 'Email Routing', link: '/deploy/email-routing' },
              ],
            },
          ],
        },
        outline: {
          label: '页面导航',
          level: [2, 3],
        },
        lastUpdated: {
          text: '最后更新于',
        },
        docFooter: {
          prev: '上一页',
          next: '下一页',
        },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      title: 'Nomio.World',
      description: 'Open Source Public Digital Identity Service',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/', activeMatch: '/en/guide/' },
          { text: 'API', link: '/en/api/', activeMatch: '/en/api/' },
          { text: 'Deploy', link: '/en/deploy/', activeMatch: '/en/deploy/' },
          {
            text: 'v1.0.0',
            items: [
              { text: 'Changelog', link: '/en/changelog' },
              { text: 'Contributing', link: '/en/contributing' },
            ],
          },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              collapsed: false,
              items: [
                { text: 'Introduction', link: '/en/guide/' },
                { text: 'Quick Start', link: '/en/guide/getting-started' },
                { text: 'Register Account', link: '/en/guide/register' },
                { text: 'Configure Domain', link: '/en/guide/domain' },
                { text: 'Using Email', link: '/en/guide/email' },
              ],
            },
            {
              text: 'Advanced',
              collapsed: false,
              items: [
                { text: 'Origin Verification', link: '/en/guide/verification' },
                { text: 'Email Forwarding', link: '/en/guide/forwarding' },
                { text: 'Security Settings', link: '/en/guide/security' },
                { text: 'FAQ', link: '/en/guide/faq' },
              ],
            },
          ],
          '/en/api/': [
            {
              text: 'API Documentation',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/en/api/' },
                { text: 'Authentication', link: '/en/api/auth' },
                { text: 'Domains', link: '/en/api/domains' },
                { text: 'Mails', link: '/en/api/mails' },
                { text: 'Settings', link: '/en/api/settings' },
              ],
            },
          ],
          '/en/deploy/': [
            {
              text: 'Deployment Guide',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/en/deploy/' },
                { text: 'Workers Deploy', link: '/en/deploy/workers' },
                { text: 'Dashboard Deploy', link: '/en/deploy/dashboard' },
                { text: 'DNS Configuration', link: '/en/deploy/dns' },
                { text: 'Email Routing', link: '/en/deploy/email-routing' },
              ],
            },
          ],
        },
        outline: {
          label: 'On this page',
          level: [2, 3],
        },
        lastUpdated: {
          text: 'Last updated',
        },
        docFooter: {
          prev: 'Previous',
          next: 'Next',
        },
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode',
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Nomio.World',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LemonStudio-hub/nomio-world' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'Copyright © 2024 Nomio.World',
    },
  },
});
