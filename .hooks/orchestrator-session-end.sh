#!/usr/bin/env bash
# Miyabi Orchestra - Orchestrator Session End Hook
# オーケストレーター（指揮者）がセッション終了時に各エージェントに作業指示を出す
#
# Requires: bash 4+ for associative arrays
# On macOS: brew install bash

set -euo pipefail

# bash 4以上をチェック
BASH_VERSION_MAJOR="${BASH_VERSINFO[0]}"
if [ "$BASH_VERSION_MAJOR" -lt 4 ]; then
    echo "⚠️  Warning: bash 4+ required for associative arrays. Current: $BASH_VERSION"
    echo "   On macOS: brew install bash"
    echo "   Falling back to simple mode..."
    USE_SIMPLE_MODE=1
else
    USE_SIMPLE_MODE=0
fi

# ログ設定
LOG_DIR="/Users/shunsuke/Dev/miyabi-private/.ai/logs/hooks"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/orchestrator-session-end-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🎭 Orchestrator Session End Hook - START"

# tmuxセッション確認
if ! tmux info &>/dev/null; then
    log "⚠️  Not in tmux session, skipping"
    exit 0
fi

# 現在のpane IDを取得
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
log "Current pane: $CURRENT_PANE"

# Session 1の全paneを取得（Orchestraセッション）
PANES=$(tmux list-panes -t 1:1 -F '#{pane_id}' 2>/dev/null || echo "")

if [ -z "$PANES" ]; then
    log "⚠️  No Miyabi Orchestra session found"
    exit 0
fi

log "📋 Found panes: $PANES"

# 各paneに最終指示を送信（自分自身を除く）
# pane index から agent名へのマッピング関数
get_agent_name() {
    case "$1" in
        1) echo "カエデ" ;;
        2) echo "サクラ" ;;
        3) echo "ツバキ" ;;
        4) echo "ボタン" ;;
        5) echo "スミレ" ;;
        *) echo "Unknown" ;;
    esac
}

for PANE in $PANES; do
    if [ "$PANE" != "$CURRENT_PANE" ]; then
        # pane indexを取得
        PANE_INDEX=$(tmux list-panes -t 1:1 -F '#{pane_id} #{pane_index}' | grep "^$PANE " | awk '{print $2}')
        AGENT_NAME=$(get_agent_name "$PANE_INDEX")

        log "📨 Sending final instruction to $PANE (index: $PANE_INDEX, agent: $AGENT_NAME)"

        # 各エージェントに最終報告指示を送信
        # 日本語文字列との互換性のため、set -u を一時的に無効化
        set +u
        tmux send-keys -t "$PANE" "" C-c 2>/dev/null || true
        sleep 0.5
        MESSAGE="オーケストレーターがセッション終了します。あなた（${AGENT_NAME}）の作業状況を簡潔に報告してください。未完了タスクがあれば、その内容と進捗を記載してください。完了したら「[${AGENT_NAME}] セッション終了報告完了」と発言してください。"
        tmux send-keys -t "$PANE" "$MESSAGE"
        sleep 0.3  # Enter送信前に待機（改行と見なされないように）
        tmux send-keys -t "$PANE" Enter
        set -u
    fi
done

# 状態保存
STATE_FILE="/Users/shunsuke/Dev/miyabi-private/.ai/orchestra-state.json"
cat > "$STATE_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "orchestrator_pane": "$CURRENT_PANE",
  "session": "1",
  "status": "orchestrator_ended",
  "message": "Orchestrator session ended, agents notified for final reports"
}
EOF

log "💾 State saved to $STATE_FILE"

# VOICEVOX通知
if command -v osascript &>/dev/null; then
    osascript -e 'display notification "オーケストレーター終了。各エージェントに最終報告を指示しました。" with title "🎭 Miyabi Orchestra"' 2>/dev/null || true
fi

log "✅ Orchestrator Session End Hook - COMPLETE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
