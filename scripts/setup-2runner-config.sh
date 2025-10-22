#!/bin/bash
#
# GitHub Actions Self-hosted Runner 2台構成セットアップスクリプト
#
# 使用方法:
#   ./setup-2runner-config.sh
#
# このスクリプトは以下を実行します:
#   1. Mac mini 1 (このマシン) にRunner登録
#   2. Mac mini 2 (Tailscale経由) にSSH接続してRunner登録
#   3. GitHub Repository Variables設定
#   4. ワークフロー有効化

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
RUNNER_VERSION="2.321.0"
RUNNER_ARCH="osx-arm64"
REPO_URL="https://github.com/customer-cloud/miyabi-private"

# Mac mini 2の接続情報
MACMINI2_HOST="100.88.201.67"
MACMINI2_USER="mini2"
MACMINI2_SSH_KEY="$HOME/.ssh/id_ed25519_macmini2"

echo ""
echo "=========================================="
echo "  GitHub Actions 2-Runner Setup"
echo "=========================================="
echo ""
echo_info "Repository: $REPO_URL"
echo_info "Mac mini 1: $(hostname) (light-jobs)"
echo_info "Mac mini 2: $MACMINI2_USER@$MACMINI2_HOST (heavy-jobs)"
echo ""

# ========================================
# Phase 1: GitHub Registration Tokens取得
# ========================================
echo_step "Phase 1: GitHub Registration Tokens取得"
echo ""
echo_warn "以下のURLにアクセスして、2つのRegistration Tokenを取得してください:"
echo ""
echo "  $REPO_URL/settings/actions/runners/new"
echo ""
echo "手順:"
echo "  1. \"New self-hosted runner\" をクリック"
echo "  2. macOS / ARM64 を選択"
echo "  3. 表示されるトークンをコピー（2回実行）"
echo ""
read -p "Mac mini 1用のRegistration Tokenを入力: " TOKEN_MACMINI1
read -p "Mac mini 2用のRegistration Tokenを入力: " TOKEN_MACMINI2
echo ""

if [ -z "$TOKEN_MACMINI1" ] || [ -z "$TOKEN_MACMINI2" ]; then
    echo_error "Registration Tokenが入力されていません"
    exit 1
fi

# ========================================
# Phase 2: Mac mini 1にRunner登録
# ========================================
echo_step "Phase 2: Mac mini 1にRunner登録"
echo ""

RUNNER_DIR_MACMINI1="$HOME/actions-runner"

if [ -d "$RUNNER_DIR_MACMINI1" ]; then
    echo_warn "既存のRunnerディレクトリが見つかりました: $RUNNER_DIR_MACMINI1"
    read -p "削除して再インストールしますか? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_info "既存ディレクトリを削除中..."
        rm -rf "$RUNNER_DIR_MACMINI1"
    else
        echo_warn "Mac mini 1のセットアップをスキップします"
        SKIP_MACMINI1=true
    fi
fi

if [ "$SKIP_MACMINI1" != "true" ]; then
    echo_info "Mac mini 1: Runnerディレクトリを作成中..."
    mkdir -p "$RUNNER_DIR_MACMINI1"
    cd "$RUNNER_DIR_MACMINI1"

    echo_info "Mac mini 1: Runnerをダウンロード中..."
    RUNNER_FILE="actions-runner-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
    DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_FILE}"
    curl -o "$RUNNER_FILE" -L "$DOWNLOAD_URL"

    echo_info "Mac mini 1: Runnerを展開中..."
    tar xzf "$RUNNER_FILE"
    rm "$RUNNER_FILE"

    echo_info "Mac mini 1: Runnerを設定中..."
    ./config.sh \
        --url "$REPO_URL" \
        --token "$TOKEN_MACMINI1" \
        --name "miyabi-runner-macmini1" \
        --labels "self-hosted,macOS,arm64,miyabi-light" \
        --unattended \
        --replace

    echo_info "Mac mini 1: サービスとして登録中..."
    sudo ./svc.sh install
    sudo ./svc.sh start

    echo_info "✅ Mac mini 1のRunner登録完了"
else
    echo_warn "Mac mini 1のセットアップをスキップしました"
fi

echo ""

# ========================================
# Phase 3: Mac mini 2にSSH接続してRunner登録
# ========================================
echo_step "Phase 3: Mac mini 2にRunner登録"
echo ""

echo_info "Mac mini 2: SSH接続確認中..."
if ! ssh -i "$MACMINI2_SSH_KEY" "$MACMINI2_USER@$MACMINI2_HOST" "echo 'SSH接続成功'" &> /dev/null; then
    echo_error "Mac mini 2への SSH接続に失敗しました"
    echo ""
    echo "以下を確認してください:"
    echo "  1. SSH キーが存在するか: $MACMINI2_SSH_KEY"
    echo "  2. Tailscaleが起動しているか: tailscale status"
    echo "  3. Mac mini 2が起動しているか"
    echo ""
    exit 1
fi

echo_info "Mac mini 2: セットアップスクリプトを転送中..."
scp -i "$MACMINI2_SSH_KEY" "$(dirname "$0")/setup-runner-mac.sh" "$MACMINI2_USER@$MACMINI2_HOST:~/setup-runner-mac.sh"

echo_info "Mac mini 2: Runnerを設定中..."
ssh -i "$MACMINI2_SSH_KEY" "$MACMINI2_USER@$MACMINI2_HOST" << EOF
chmod +x ~/setup-runner-mac.sh
~/setup-runner-mac.sh miyabi-runner-macmini2 $TOKEN_MACMINI2

# ラベルを変更（heavy-jobs用）
cd ~/actions-runner
./config.sh remove --token $TOKEN_MACMINI2 || true
./config.sh \
    --url "$REPO_URL" \
    --token "$TOKEN_MACMINI2" \
    --name "miyabi-runner-macmini2" \
    --labels "self-hosted,macOS,arm64,miyabi-heavy" \
    --unattended \
    --replace

# サービスとして起動
sudo ./svc.sh install
sudo ./svc.sh start

echo "✅ Mac mini 2のRunner登録完了"
EOF

echo_info "✅ Mac mini 2のRunner登録完了"
echo ""

# ========================================
# Phase 4: GitHub Repository Variables設定
# ========================================
echo_step "Phase 4: GitHub Repository Variables設定"
echo ""

if ! command -v gh &> /dev/null; then
    echo_warn "GitHub CLI (gh) がインストールされていません"
    echo_info "Homebrewでインストール中..."
    brew install gh
fi

echo_info "GitHub CLIで認証中..."
gh auth status || gh auth login

echo_info "Repository Variablesを設定中..."
# RUNNER_TYPEはセルフホステッド用に設定しない（デフォルトのmatrixを使用）
echo_info "RUNNER_TYPE変数の設定をスキップ（2-runner構成ではラベルベースで制御）"

echo ""

# ========================================
# Phase 5: ワークフロー有効化
# ========================================
echo_step "Phase 5: ワークフロー有効化"
echo ""

echo_info "新しいワークフローファイルを確認中..."
if [ -f ".github/workflows/rust-2runner.yml" ]; then
    echo_info "✅ rust-2runner.yml が見つかりました"
else
    echo_error "rust-2runner.yml が見つかりません"
    echo_warn "手動で作成してください"
fi

echo ""

# ========================================
# Phase 6: 動作確認
# ========================================
echo_step "Phase 6: 動作確認"
echo ""

echo_info "Runner ステータス確認:"
echo ""
echo "  GitHubでRunnerのステータスを確認してください:"
echo "  $REPO_URL/settings/actions/runners"
echo ""
echo "  以下のRunnerが \"Idle\" と表示されていればOK:"
echo "    ✅ miyabi-runner-macmini1 (light-jobs)"
echo "    ✅ miyabi-runner-macmini2 (heavy-jobs)"
echo ""

read -p "Runnerのステータスを確認しましたか? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_warn "GitHubでステータスを確認してください"
    echo ""
fi

# ========================================
# 完了
# ========================================
echo ""
echo "=========================================="
echo "  ✅ セットアップ完了！"
echo "=========================================="
echo ""
echo "次のステップ:"
echo ""
echo "  1. テストワークフローを実行:"
echo "     gh workflow run rust-2runner.yml"
echo ""
echo "  2. ワークフロー実行状況を確認:"
echo "     gh run list --workflow=rust-2runner.yml"
echo ""
echo "  3. Runner ログ確認:"
echo "     # Mac mini 1"
echo "     tail -f ~/actions-runner/_diag/Runner_*.log"
echo ""
echo "     # Mac mini 2 (SSH経由)"
echo "     ssh -i $MACMINI2_SSH_KEY $MACMINI2_USER@$MACMINI2_HOST 'tail -f ~/actions-runner/_diag/Runner_*.log'"
echo ""
echo "トラブルシューティング:"
echo "  - Runner停止: sudo ./svc.sh stop"
echo "  - Runner再起動: sudo ./svc.sh restart"
echo "  - Runner状態確認: sudo ./svc.sh status"
echo ""
