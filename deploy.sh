#!/usr/bin/env bash
# ============================================================
# Namio.World 一键部署脚本
# 用法: ./deploy.sh [all|db|api|gateway|email|dashboard]
# ============================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# 项目根目录
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ============================================================
# 前置检查
# ============================================================
check_prerequisites() {
  info "检查部署前置条件..."

  # wrangler
  if ! command -v wrangler &>/dev/null; then
    err "wrangler 未安装，请运行: npm install -g wrangler"
    exit 1
  fi

  # wrangler 登录状态
  if ! wrangler whoami &>/dev/null 2>&1; then
    err "wrangler 未登录，请运行: wrangler login"
    exit 1
  fi

  # node
  if ! command -v node &>/dev/null; then
    err "Node.js 未安装"
    exit 1
  fi

  ok "前置条件检查通过"
}

# ============================================================
# 安装依赖
# ============================================================
install_deps() {
  info "安装依赖..."
  cd "$ROOT/workers/api" && npm install --silent
  cd "$ROOT/workers/gateway" && npm install --silent
  cd "$ROOT/workers/email" && npm install --silent
  cd "$ROOT/dashboard" && npm install --silent
  cd "$ROOT"
  ok "依赖安装完成"
}

# ============================================================
# 创建 D1 数据库
# ============================================================
create_database() {
  info "创建 D1 数据库..."

  # 检查是否已存在
  if wrangler d1 list 2>/dev/null | grep -q "namio-db"; then
    warn "数据库 namio-db 已存在，跳过创建"
    DB_ID=$(wrangler d1 list 2>/dev/null | grep "namio-db" | awk '{print $2}')
  else
    OUTPUT=$(wrangler d1 create namio-db 2>&1)
    echo "$OUTPUT"
    # 从输出中提取 database_id
    DB_ID=$(echo "$OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")
    if [ -z "$DB_ID" ]; then
      err "无法提取 database_id，请手动查看上方输出"
      return 1
    fi
  fi

  ok "数据库 ID: $DB_ID"

  # 更新所有 wrangler.toml
  info "更新 wrangler.toml 配置..."
  for toml in "$ROOT"/workers/*/wrangler.toml; do
    sed -i "s/database_id = \"<your-database-id>\"/database_id = \"$DB_ID\"/" "$toml"
    ok "已更新: $toml"
  done

  # 初始化 schema
  info "初始化数据库表结构..."
  wrangler d1 execute namio-db --file="$ROOT/schema.sql"
  ok "数据库表结构初始化完成"
}

# ============================================================
# 设置 JWT_SECRET
# ============================================================
setup_jwt_secret() {
  local API_TOML="$ROOT/workers/api/wrangler.toml"

  # 检查是否已配置
  if grep -q '<your-jwt-secret>' "$API_TOML"; then
    # 生成随机 secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n' | head -c 64)
    sed -i "s/<your-jwt-secret>/$JWT_SECRET/" "$API_TOML"
    ok "JWT_SECRET 已生成并写入 wrangler.toml"
  else
    warn "JWT_SECRET 已配置，跳过"
  fi
}

# ============================================================
# 部署 Workers
# ============================================================
deploy_api() {
  info "部署 API Worker..."
  cd "$ROOT/workers/api"
  npm install --silent
  wrangler deploy
  ok "API Worker 部署完成"
  cd "$ROOT"
}

deploy_gateway() {
  info "部署 Gateway Worker..."
  cd "$ROOT/workers/gateway"
  npm install --silent
  wrangler deploy
  ok "Gateway Worker 部署完成"
  cd "$ROOT"
}

deploy_email() {
  info "部署 Email Worker..."
  cd "$ROOT/workers/email"
  npm install --silent
  wrangler deploy
  ok "Email Worker 部署完成"
  cd "$ROOT"
}

# ============================================================
# 部署 Dashboard
# ============================================================
deploy_dashboard() {
  info "构建 Dashboard..."
  cd "$ROOT/dashboard"
  npm install --silent
  npm run build
  ok "构建完成"

  info "部署到 Cloudflare Pages..."
  npx wrangler pages deploy dist --project-name=namio-dashboard
  ok "Dashboard 部署完成"
  cd "$ROOT"
}

# ============================================================
# 运行测试
# ============================================================
run_tests() {
  info "运行测试套件..."

  local FAILED=0

  cd "$ROOT/workers/api"
  if npx vitest run 2>&1 | tail -1 | grep -q "passed"; then
    ok "API Worker 测试通过"
  else
    err "API Worker 测试失败"
    FAILED=1
  fi

  cd "$ROOT/workers/gateway"
  if npx vitest run 2>&1 | tail -1 | grep -q "passed"; then
    ok "Gateway Worker 测试通过"
  else
    err "Gateway Worker 测试失败"
    FAILED=1
  fi

  cd "$ROOT/workers/email"
  if npx vitest run 2>&1 | tail -1 | grep -q "passed"; then
    ok "Email Worker 测试通过"
  else
    err "Email Worker 测试失败"
    FAILED=1
  fi

  cd "$ROOT/dashboard"
  if npx vitest run 2>&1 | tail -1 | grep -q "passed"; then
    ok "Dashboard 测试通过"
  else
    err "Dashboard 测试失败"
    FAILED=1
  fi

  cd "$ROOT"

  if [ $FAILED -eq 1 ]; then
    err "存在测试失败，请修复后重新部署"
    exit 1
  fi

  ok "全部测试通过"
}

# ============================================================
# 部署后验证
# ============================================================
post_deploy_check() {
  info "部署后验证..."

  # 尝试访问 API
  local API_URL="https://namio.world/api/auth/me"
  if curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null | grep -q "401"; then
    ok "API Worker 响应正常 (401 = 未认证，符合预期)"
  else
    warn "API Worker 可能需要等待 DNS 生效"
  fi

  echo ""
  info "=========================================="
  info "  部署完成！"
  info "=========================================="
  echo ""
  info "接下来需要手动完成："
  info "  1. 在 Cloudflare Dashboard 配置 DNS:"
  info "     - A 记录: *.namio.world → Cloudflare (橙色云)"
  info "     - MX 记录: namio.world → route.mx.cloudflare.net"
  info "  2. 在 Email Routing 中配置 Catch-all → Email Worker"
  info "  3. 访问 https://namio-dashboard.pages.dev 查看前端"
  echo ""
}

# ============================================================
# 主流程
# ============================================================
main() {
  local TARGET="${1:-all}"

  echo ""
  info "=========================================="
  info "  Namio.World 部署工具"
  info "  目标: $TARGET"
  info "=========================================="
  echo ""

  case "$TARGET" in
    all)
      check_prerequisites
      install_deps
      run_tests
      setup_jwt_secret
      create_database
      deploy_api
      deploy_gateway
      deploy_email
      deploy_dashboard
      post_deploy_check
      ;;
    db)
      check_prerequisites
      create_database
      ;;
    api)
      check_prerequisites
      deploy_api
      ;;
    gateway)
      check_prerequisites
      deploy_gateway
      ;;
    email)
      check_prerequisites
      deploy_email
      ;;
    dashboard)
      check_prerequisites
      deploy_dashboard
      ;;
    test)
      run_tests
      ;;
    *)
      err "未知目标: $TARGET"
      echo "用法: ./deploy.sh [all|db|api|gateway|email|dashboard|test]"
      exit 1
      ;;
  esac
}

main "$@"
