---
layout: home
title: Nomio.World - 开源公益数字身份服务
titleTemplate: 免费域名和邮箱

hero:
  name: Nomio.World
  text: 开源公益数字身份服务
  tagline: 免费获得 your-name.nomio.world 二级域名和 your-name@nomio.world 邮箱地址
  image:
    src: /hero.svg
    alt: Nomio.World
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/LemonStudio-hub/nomio-world

features:
  - icon: 🌐
    title: 免费域名
    details: 免费获得 your-name.nomio.world 二级域名，支持自定义源站指向，Cloudflare DNS 全球加速。
  - icon: 📧
    title: 免费邮箱
    details: 免费获得 your-name@nomio.world 邮箱地址，支持邮件转发，100MB 存储空间。
  - icon: ⚡
    title: 边缘计算
    details: 基于 Cloudflare 边缘网络，全球 300+ 节点，延迟低于 50ms，零成本运营。
  - icon: 🔒
    title: 安全可靠
    details: 强制 HTTPS、JWT 认证、PBKDF2 哈希，安全机制开箱即用。
  - icon: 🎨
    title: 现代设计
    details: 简洁优雅的界面设计，流畅的动画效果，优秀的用户体验。
  - icon: 🔓
    title: 完全开源
    details: 代码完全开源，AGPL-3.0 协议，任何人都可以审计、贡献和分叉。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #4f46e5 30%, #0ea5e9);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #4f46e5 50%, #0ea5e9 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
