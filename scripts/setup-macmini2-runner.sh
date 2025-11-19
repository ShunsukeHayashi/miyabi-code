#!/bin/bash
#
# Mac mini 2 用 GitHub Actions Runner セットアップスクリプト
#
# このスクリプトを Mac mini 2 (mini2@shuhayas002) で実行してください
#
# 使用方法:
#   1. このスクリプトを Mac mini 2 に転送
#   2. chmod +x setup-macmini2-runner.sh
#   3. ./setup-macmini2-runner.sh

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

# 設定
RUNNER_VERSION="2.329.0"
RUNNER_ARCH="osx-arm64"
ORG_URL="https://github.com/customer-cloud"
REGISTRATION_TOKEN="ACXYUTXMP5KJ3JTH3SFSOQLI7CKPS"
RUNNER_NAME="miyabi-runner-macmini2"
RUNNER_LABELS="self-hosted,macOS,arm64,miyabi-heavy"

echo ""
echo "=========================================="
echo "  Mac mini 2 Runner Setup"
echo "=========================================="
echo ""
echo_info "Organization: $ORG_URL"
echo_info "Runner Name: $RUNNER_NAME"
echo_info "Labels: $RUNNER_LABELS"
echo_info "Role: Heavy Jobs (test, build)"
echo ""

# ========================================
# Step 1: ディレクトリ作成
# ========================================
echo_step "Step 1: ディレクトリ作成"
RUNNER_DIR="$HOME/actions-runner"
echo_info "Runner directory: $RUNNER_DIR"

if [ -d "$RUNNER_DIR" ]; then
    echo_warn "既存の Runner ディレクトリが見つかりました: $RUNNER_DIR"
    read -p "削除して再インストールしますか? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_info "既存ディレクトリを削除中..."
        rm -rf "$RUNNER_DIR"
    else
        echo_error "セットアップを中止しました"
        exit 1
    fi
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

echo ""

# ========================================
# Step 2: Runner ダウンロード
# ========================================
echo_step "Step 2: Runner ダウンロード"
RUNNER_FILE="actions-runner-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_FILE}"

echo_info "ダウンロード中: $DOWNLOAD_URL"
curl -o "$RUNNER_FILE" -L "$DOWNLOAD_URL"

if [ $? -ne 0 ]; then
    echo_error "ダウンロードに失敗しました"
    exit 1
fi

echo ""

# ========================================
# Step 3: Runner 解凍
# ========================================
echo_step "Step 3: Runner 解凍"
echo_info "解凍中: $RUNNER_FILE"
tar xzf "$RUNNER_FILE"
rm "$RUNNER_FILE"

echo ""

# ========================================
# Step 4: Runner 設定
# ========================================
echo_step "Step 4: Runner 設定"
echo_info "Runner を設定中..."
./config.sh \
    --url "$ORG_URL" \
    --token "$REGISTRATION_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --unattended \
    --replace

if [ $? -ne 0 ]; then
    echo_error "Runner の設定に失敗しました"
    exit 1
fi

echo ""

# ========================================
# Step 5: サービスとして登録
# ========================================
echo_step "Step 5: サービスとして登録"
echo_info "Runner をサービスとして登録中..."
./svc.sh install

if [ $? -ne 0 ]; then
    echo_error "サービスの登録に失敗しました"
    exit 1
fi

echo ""

# ========================================
# Step 6: サービス起動
# ========================================
echo_step "Step 6: サービス起動"
echo_info "Runner を起動中..."
./svc.sh start

if [ $? -ne 0 ]; then
    echo_error "Runner の起動に失敗しました"
    exit 1
fi

echo ""

# ========================================
# Step 7: ステータス確認
# ========================================
echo_step "Step 7: ステータス確認"
./svc.sh status

echo ""
echo "=========================================="
echo "  ✅ セットアップ完了！"
echo "=========================================="
echo ""
echo "Runner 情報:"
echo "  Name: $RUNNER_NAME"
echo "  Labels: $RUNNER_LABELS"
echo "  Directory: $RUNNER_DIR"
echo ""
echo "GitHubでRunnerのステータスを確認してください:"
echo "  https://github.com/organizations/customer-cloud/settings/actions/runners"
echo ""
echo "Runner が \"Idle\" と表示されていれば正常に動作しています。"
echo ""
echo "コマンド:"
echo "  ステータス確認: ./svc.sh status"
echo "  停止: ./svc.sh stop"
echo "  再起動: ./svc.sh restart"
echo "  ログ確認: tail -f $RUNNER_DIR/_diag/Runner_*.log"
echo ""
