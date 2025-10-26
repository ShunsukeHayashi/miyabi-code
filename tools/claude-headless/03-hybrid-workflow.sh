#!/bin/bash
# Miyabi Hybrid Mode: Interactive → Headless ワークフロー
# Usage: ./03-hybrid-workflow.sh <issue_number>

set -e

ISSUE_NUM="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="/tmp/miyabi-headless"
mkdir -p "$LOG_DIR"

# カラー出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 引数チェック
if [ -z "$ISSUE_NUM" ]; then
    echo "Usage: $0 <issue_number>"
    exit 1
fi

log_info "=========================================="
log_info "Miyabi Hybrid Workflow"
log_info "=========================================="
log_info "Issue: #$ISSUE_NUM"
log_info "モード: Interactive → Headless"
log_info ""

# Phase 1: Interactive Mode（ユーザー確認）
log_info "Phase 1: Interactive Mode - Issue 確認"
log_info "----------------------------------------"
log_info "Stream Deck 経由で Claude Code に Issue 内容を表示します..."
log_info ""

# Stream Deck の "Next" ボタンをシミュレート
MESSAGE="Issue #${ISSUE_NUM} の詳細を表示してください。処理すべき内容を分析して、実装の難易度と所要時間を見積もってください。"

# メッセージをクリップボードにコピー
echo -n "$MESSAGE" | pbcopy

# AppleScript で VS Code に送信
osascript <<EOF > /dev/null 2>&1
tell application "Visual Studio Code"
    activate
end tell
delay 0.5
tell application "System Events"
    keystroke "l" using command down
    delay 0.8
    keystroke "v" using command down
    delay 0.3
    key code 36
end tell
EOF

log_success "Interactive Mode: メッセージ送信完了"
log_info "VS Code の Claude Code でレスポンスを確認してください..."
log_info ""

# ユーザー確認を待機
log_warn "----------------------------------------"
read -p "Claude Code の分析結果を確認しましたか？ [y/N]: " confirm1
log_info ""

if [ "$confirm1" != "y" ] && [ "$confirm1" != "Y" ]; then
    log_info "処理を中止しました"
    exit 0
fi

read -p "Headless Mode で自動実装を開始しますか？ [y/N]: " confirm2
log_info ""

if [ "$confirm2" != "y" ] && [ "$confirm2" != "Y" ]; then
    log_info "処理を中止しました"
    exit 0
fi

# Phase 2: Headless Mode（自動実装）
log_info "Phase 2: Headless Mode - 自動実装"
log_info "----------------------------------------"
log_info "Headless Mode で自動実装を開始します..."
log_info ""

# Headless Agent 実行
"$SCRIPT_DIR/01-process-issue.sh" "$ISSUE_NUM"

if [ $? -ne 0 ]; then
    echo -e "\033[0;31m[ERROR]\033[0m Headless Mode 実行に失敗しました"
    exit 1
fi

log_success "Headless Mode: 実行完了"
log_info ""

# Phase 3: 結果報告（Interactive Mode に戻る）
log_info "Phase 3: 結果報告"
log_info "----------------------------------------"

# レポートを読み込み
REPORT_FILE="$LOG_DIR/report-$ISSUE_NUM.md"
if [ -f "$REPORT_FILE" ]; then
    log_success "レポート生成完了: $REPORT_FILE"
    log_info ""
    log_info "レポート概要:"
    head -20 "$REPORT_FILE"
    log_info ""
fi

# Interactive Mode に通知
RESULT_MESSAGE="Issue #${ISSUE_NUM} の Headless 実装が完了しました。レポート: ${REPORT_FILE}"
echo -n "$RESULT_MESSAGE" | pbcopy

osascript <<EOF > /dev/null 2>&1
tell application "Visual Studio Code"
    activate
end tell
delay 0.5
tell application "System Events"
    keystroke "l" using command down
    delay 0.8
    keystroke "v" using command down
    delay 0.3
    key code 36
end tell
EOF

log_success "Interactive Mode に結果を通知しました"
log_info ""

# VOICEVOX 通知
if [ -f "$PROJECT_ROOT/tools/voicevox_enqueue.sh" ]; then
    "$PROJECT_ROOT/tools/voicevox_enqueue.sh" "Issue ${ISSUE_NUM} のハイブリッド処理が完了しました"
fi

log_success "=========================================="
log_success "ハイブリッドワークフロー完了"
log_success "=========================================="
log_info "1. Interactive Mode: Issue 確認・承認"
log_info "2. Headless Mode: 自動実装"
log_info "3. Interactive Mode: 結果報告"
log_info ""
log_info "VS Code の Claude Code でレポートを確認してください"

exit 0
