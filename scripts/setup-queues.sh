#!/bin/bash
# 设置Cloudflare Queue

set -e

echo "=========================================="
echo "  设置 Cloudflare Queue"
echo "=========================================="

# 检查wrangler是否安装
if ! command -v wrangler &>/dev/null; then
  echo "错误: wrangler 未安装，请运行: npm install -g wrangler"
  exit 1
fi

# 创建主队列
echo "创建邮件队列: nomio-email-queue"
wrangler queues create nomio-email-queue 2>/dev/null || echo "队列已存在，跳过"

# 创建死信队列
echo "创建死信队列: nomio-email-dlq"
wrangler queues create nomio-email-dlq 2>/dev/null || echo "队列已存在，跳过"

echo ""
echo "=========================================="
echo "  Queue 设置完成！"
echo "=========================================="
echo ""
echo "队列信息："
echo "  - 主队列: nomio-email-queue"
echo "  - 死信队列: nomio-email-dlq"
echo ""
echo "接下来请部署："
echo "  1. Email Handler (Producer): cd workers/email-handler && npm run deploy"
echo "  2. Email Consumer: cd workers/email && npm run deploy"
