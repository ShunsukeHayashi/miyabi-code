#!/bin/bash
#
# GitHub Actions Self-hosted Runners 一括デプロイスクリプト
#
# このスクリプトは、3台のマシンすべてにRunnerを自動セットアップします：
# - Mac mini #1 (Tailscale/LAN経由)
# - Mac mini #2 (Tailscale/LAN経由)
# - Windows GPU PC (LAN経由 - 手動実行が必要)
#
# 使用方法:
#   ./deploy-all-runners.sh

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# GitHub組織URL
ORG_URL="https://github.com/customer-cloud"

echo ""
echo "=========================================="
echo " GitHub Actions Self-hosted Runners"
echo " 一括デプロイスクリプト"
echo "=========================================="
echo ""
echo "このスクリプトは以下のマシンにRunnerをセットアップします:"
echo "  1. Mac mini #1 (192.168.3.27 / macmini-ts)"
echo "  2. Mac mini #2 (192.168.3.26 / macmini2-ts)"
echo "  3. Windows GPU PC (手動セットアップ)"
echo ""

# GitHub CLI確認
if ! command -v gh &> /dev/null; then
    echo_error "gh CLI がインストールされていません"
    echo "インストール: brew install gh"
    exit 1
fi

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    echo_error "GitHub認証されていません"
    echo "認証: gh auth login"
    exit 1
fi

echo_info "GitHub認証: OK"
echo ""

# ===================================
# Step 1: 登録トークン生成
# ===================================
echo_step "Step 1: Runner登録トークン生成中..."

TOKEN_MACMINI1=$(gh api --method POST orgs/customer-cloud/actions/runners/registration-token | jq -r '.token')
TOKEN_MACMINI2=$(gh api --method POST orgs/customer-cloud/actions/runners/registration-token | jq -r '.token')
TOKEN_WINDOWS=$(gh api --method POST orgs/customer-cloud/actions/runners/registration-token | jq -r '.token')

if [ -z "$TOKEN_MACMINI1" ] || [ -z "$TOKEN_MACMINI2" ] || [ -z "$TOKEN_WINDOWS" ]; then
    echo_error "トークン生成に失敗しました"
    exit 1
fi

echo_info "✅ トークン生成完了"
echo "   Mac mini #1: ${TOKEN_MACMINI1:0:20}..."
echo "   Mac mini #2: ${TOKEN_MACMINI2:0:20}..."
echo "   Windows GPU: ${TOKEN_WINDOWS:0:20}..."
echo ""

# ===================================
# Step 2: Mac mini #1 セットアップ
# ===================================
echo_step "Step 2: Mac mini #1 セットアップ"

# 接続テスト（Tailscale優先）
if ssh -o ConnectTimeout=5 macmini-ts "exit" 2>/dev/null; then
    MACMINI1_HOST="macmini-ts"
    echo_info "接続方法: Tailscale (100.110.93.20)"
elif ssh -o ConnectTimeout=5 macmini "exit" 2>/dev/null; then
    MACMINI1_HOST="macmini"
    echo_info "接続方法: LAN (192.168.3.27)"
else
    echo_error "Mac mini #1 に接続できません（オフラインの可能性）"
    echo_warn "スキップして次に進みます..."
    MACMINI1_HOST=""
fi

if [ -n "$MACMINI1_HOST" ]; then
    echo_info "セットアップスクリプト転送中..."
    scp scripts/setup-runner-mac.sh "$MACMINI1_HOST:~/setup-runner-mac.sh"

    echo_info "Runner セットアップ実行中..."
    ssh "$MACMINI1_HOST" "bash ~/setup-runner-mac.sh macmini $TOKEN_MACMINI1"

    echo_info "✅ Mac mini #1 セットアップ完了"
else
    echo_warn "⚠️  Mac mini #1 はスキップされました"
fi
echo ""

# ===================================
# Step 3: Mac mini #2 セットアップ
# ===================================
echo_step "Step 3: Mac mini #2 セットアップ"

# 接続テスト（Tailscale優先）
if ssh -o ConnectTimeout=5 macmini2-ts "exit" 2>/dev/null; then
    MACMINI2_HOST="macmini2-ts"
    echo_info "接続方法: Tailscale"
elif ssh -o ConnectTimeout=5 macmini2 "exit" 2>/dev/null; then
    MACMINI2_HOST="macmini2"
    echo_info "接続方法: LAN (192.168.3.26)"
else
    echo_error "Mac mini #2 に接続できません（オフラインの可能性）"
    echo_warn "スキップして次に進みます..."
    MACMINI2_HOST=""
fi

if [ -n "$MACMINI2_HOST" ]; then
    echo_info "セットアップスクリプト転送中..."
    scp scripts/setup-runner-mac.sh "$MACMINI2_HOST:~/setup-runner-mac.sh"

    echo_info "Runner セットアップ実行中..."
    ssh "$MACMINI2_HOST" "bash ~/setup-runner-mac.sh macmini2 $TOKEN_MACMINI2"

    echo_info "✅ Mac mini #2 セットアップ完了"
else
    echo_warn "⚠️  Mac mini #2 はスキップされました"
fi
echo ""

# ===================================
# Step 4: Windows GPU PC セットアップ
# ===================================
echo_step "Step 4: Windows GPU PC セットアップ"

echo_warn "Windows GPU PC は手動セットアップが必要です"
echo ""
echo "以下の手順でセットアップしてください:"
echo ""
echo "1. PowerShell を管理者権限で起動"
echo "2. 以下のコマンドを実行:"
echo ""
echo "   cd $PWD"
echo "   .\scripts\setup-runner-windows.ps1 -RunnerName \"windows-gpu\" -RegistrationToken \"$TOKEN_WINDOWS\""
echo ""
echo_info "トークンをクリップボードにコピーしますか? (y/n)"
read -p "> " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$TOKEN_WINDOWS" | pbcopy
    echo_info "✅ トークンをクリップボードにコピーしました"
fi
echo ""

# ===================================
# Step 5: Runner状態確認
# ===================================
echo_step "Step 5: Runner登録状態確認"

sleep 3  # GitHub API反映待ち

echo_info "組織のRunner一覧を取得中..."
gh api orgs/customer-cloud/actions/runners | jq -r '.runners[] | "\(.name) - \(.status) (\(.labels[].name | select(. == "self-hosted" or . == "macOS" or . == "Windows")))"'

echo ""
echo "=========================================="
echo " 🎉 デプロイ完了！"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "  1. Windows GPU PC で手動セットアップを完了"
echo "  2. 停止中ワークフローを再有効化:"
echo "     - gh workflow enable \"RefresherAgent - Issue Status Auto Refresh\""
echo "     - gh workflow enable \"Docker Publish to GHCR\""
echo "     - gh workflow enable \"Deploy GitHub Pages\""
echo "  3. テストワークフロー実行:"
echo "     - gh workflow run \"RefresherAgent - Issue Status Auto Refresh\""
echo ""
echo "Runner監視:"
echo "  gh api orgs/customer-cloud/actions/runners"
echo ""
