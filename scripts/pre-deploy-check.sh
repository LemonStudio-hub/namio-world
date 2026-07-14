#!/usr/bin/env bash
# ============================================================
# 部署前检查脚本
# 检查所有前置条件是否满足
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${GREEN}[PASS]${NC} $1"; ((PASS++)); }
check_fail() { echo -e "  ${RED}[FAIL]${NC} $1"; ((FAIL++)); }
check_warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; ((WARN++)); }

echo ""
echo "=========================================="
echo "  Namio.World 部署前检查"
echo "=========================================="
echo ""

# ---- 环境检查 ----
echo "▸ 环境"

if command -v node &>/dev/null; then
  check_pass "Node.js $(node --version)"
else
  check_fail "Node.js 未安装"
fi

if command -v npm &>/dev/null; then
  check_pass "npm $(npm --version)"
else
  check_fail "npm 未安装"
fi

if command -v wrangler &>/dev/null; then
  check_pass "wrangler $(wrangler --version 2>/dev/null || echo 'installed')"
else
  check_fail "wrangler 未安装 (npm install -g wrangler)"
fi

# ---- 认证检查 ----
echo ""
echo "▸ Cloudflare 认证"

if wrangler whoami &>/dev/null 2>&1; then
  USER=$(wrangler whoami 2>/dev/null | head -1)
  check_pass "已登录: $USER"
else
  check_fail "wrangler 未登录 (wrangler login)"
fi

# ---- 依赖检查 ----
echo ""
echo "▸ 项目依赖"

for dir in workers/api workers/gateway workers/email dashboard; do
  if [ -d "$dir/node_modules" ]; then
    check_pass "$dir/node_modules 存在"
  else
    check_warn "$dir/node_modules 不存在 (需 npm install)"
  fi
done

# ---- 配置检查 ----
echo ""
echo "▸ 配置文件"

for toml in workers/api/wrangler.toml workers/gateway/wrangler.toml workers/email/wrangler.toml; do
  if [ -f "$toml" ]; then
    if grep -q '<your-database-id>' "$toml"; then
      check_warn "$toml: database_id 未配置"
    else
      check_pass "$toml: database_id 已配置"
    fi
  else
    check_fail "$toml 不存在"
  fi
done

if [ -f "workers/api/wrangler.toml" ]; then
  if grep -q '<your-jwt-secret>' workers/api/wrangler.toml; then
    check_warn "workers/api/wrangler.toml: JWT_SECRET 未配置"
  else
    check_pass "workers/api/wrangler.toml: JWT_SECRET 已配置"
  fi
fi

# ---- 测试检查 ----
echo ""
echo "▸ 测试（快速检查）"

for dir in workers/api workers/gateway workers/email dashboard; do
  if [ -d "$dir/node_modules" ]; then
    RESULT=$(cd "$dir" && npx vitest run 2>&1 | tail -1)
    if echo "$RESULT" | grep -q "passed"; then
      check_pass "$dir: 测试通过"
    else
      check_fail "$dir: 测试失败"
    fi
  else
    check_warn "$dir: 跳过（依赖未安装）"
  fi
done

# ---- 汇总 ----
echo ""
echo "=========================================="
echo -e "  通过: ${GREEN}$PASS${NC}  失败: ${RED}$FAIL${NC}  警告: ${YELLOW}$WARN${NC}"
echo "=========================================="
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}存在失败项，请修复后再部署${NC}"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo -e "${YELLOW}存在警告项，建议处理后部署${NC}"
  exit 0
else
  echo -e "${GREEN}全部检查通过，可以部署！${NC}"
  exit 0
fi
