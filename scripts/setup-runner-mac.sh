#!/bin/bash
#
# GitHub Actions Self-hosted Runner セットアップスクリプト（macOS用）
#
# 使用方法:
#   ./setup-runner-mac.sh <runner-name> <registration-token>
#
# 例:
#   ./setup-runner-mac.sh macmini YOUR_REGISTRATION_TOKEN

set -e

RUNNER_NAME="${1:-macmini}"
REGISTRATION_TOKEN="${2}"
REPO_URL="https://github.com/customer-cloud/miyabi-private"
RUNNER_VERSION="2.321.0"
RUNNER_ARCH="osx-arm64"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 引数チェック
if [ -z "$REGISTRATION_TOKEN" ]; then
    echo_error "Registration token が指定されていません"
    echo ""
    echo "使用方法:"
    echo "  ./setup-runner-mac.sh <runner-name> <registration-token>"
    echo ""
    echo "Registration token の取得:"
    echo "  https://github.com/organizations/customer-cloud/settings/actions/runners/new"
    exit 1
fi

echo_info "GitHub Actions Self-hosted Runner セットアップ開始"
echo_info "Runner名: $RUNNER_NAME"
echo_info "組織: $ORG_URL"
echo ""

# 作業ディレクトリ作成
RUNNER_DIR="$HOME/actions-runner"
echo_info "作業ディレクトリ: $RUNNER_DIR"

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

# Runner ダウンロード
echo_info "Runner をダウンロード中..."
RUNNER_FILE="actions-runner-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_FILE}"

curl -o "$RUNNER_FILE" -L "$DOWNLOAD_URL"

if [ $? -ne 0 ]; then
    echo_error "ダウンロードに失敗しました"
    exit 1
fi

echo_info "Runner を展開中..."
tar xzf "$RUNNER_FILE"
rm "$RUNNER_FILE"

# Runner 設定
echo_info "Runner を設定中..."
./config.sh \
    --url "$REPO_URL" \
    --token "$REGISTRATION_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "self-hosted,macOS,arm64,rust,docker" \
    --unattended \
    --replace

if [ $? -ne 0 ]; then
    echo_error "Runner の設定に失敗しました"
    exit 1
fi

# サービスとして登録
echo_info "Runner をサービスとして登録中..."
sudo ./svc.sh install

if [ $? -ne 0 ]; then
    echo_warn "サービスの登録に失敗しました（sudo 権限が必要）"
    echo_info "手動で以下を実行してください:"
    echo "  cd $RUNNER_DIR"
    echo "  sudo ./svc.sh install"
    echo "  sudo ./svc.sh start"
    exit 1
fi

# サービス起動
echo_info "Runner を起動中..."
sudo ./svc.sh start

if [ $? -ne 0 ]; then
    echo_error "Runner の起動に失敗しました"
    exit 1
fi

echo ""
echo_info "✅ セットアップ完了！"
echo ""
echo "Runner ステータス確認:"
echo "  sudo ./svc.sh status"
echo ""
echo "Runner ログ確認:"
echo "  tail -f $RUNNER_DIR/_diag/Runner_*.log"
echo ""
echo "Runner 停止:"
echo "  sudo ./svc.sh stop"
echo ""
echo "Runner アンインストール:"
echo "  sudo ./svc.sh uninstall"
echo "  cd $HOME && rm -rf $RUNNER_DIR"
echo ""
