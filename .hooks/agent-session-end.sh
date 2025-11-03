#!/usr/bin/env bash
# Miyabi Orchestra - Agent Session End Hook
# 各エージェント（作業者）がセッション終了時にオーケストレーターに完了報告を上げる

set -euo pipefail

# ログ設定
LOG_DIR="/Users/shunsuke/Dev/miyabi-private/.ai/logs/hooks"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/agent-session-end-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🎨 Agent Session End Hook - START"

# tmuxセッション確認
if ! tmux info &>/dev/null; then
    log "⚠️  Not in tmux session, skipping"
    exit 0
fi

# 現在のpane IDを取得
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
CURRENT_INDEX=$(tmux display-message -p '#{pane_index}')
log "Current pane: $CURRENT_PANE (index: $CURRENT_INDEX)"

# エージェント名をpane indexから判定
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

AGENT_NAME=$(get_agent_name "$CURRENT_INDEX")
log "Agent name: $AGENT_NAME"

# オーケストレーターpane（通常は%1またはindex=1）を取得
ORCHESTRATOR_PANE=$(tmux list-panes -t 1:1 -F '#{pane_id} #{pane_index}' 2>/dev/null | grep ' 1$' | awk '{print $1}' || echo "")

if [ -z "$ORCHESTRATOR_PANE" ]; then
    log "⚠️  Orchestrator pane not found"
    # フォールバック: 状態ファイルから読み込み
    STATE_FILE="/Users/shunsuke/Dev/miyabi-private/.ai/orchestra-state.json"
    if [ -f "$STATE_FILE" ]; then
        ORCHESTRATOR_PANE=$(jq -r '.orchestrator_pane' "$STATE_FILE" 2>/dev/null || echo "")
    fi
fi

if [ -z "$ORCHESTRATOR_PANE" ]; then
    log "❌ Cannot find orchestrator pane, saving report to file"
    REPORT_FILE="/Users/shunsuke/Dev/miyabi-private/.ai/logs/agent-reports/$AGENT_NAME-$(date +%Y%m%d-%H%M%S).txt"
    mkdir -p "$(dirname "$REPORT_FILE")"
    echo "[$AGENT_NAME] セッション終了。オーケストレーターに報告できませんでした。" > "$REPORT_FILE"
    log "📄 Report saved to $REPORT_FILE"
else
    log "📨 Sending completion report to orchestrator pane: $ORCHESTRATOR_PANE"

    # オーケストレーターに完了報告を送信
    tmux send-keys -t "$ORCHESTRATOR_PANE" "" C-c 2>/dev/null || true
    sleep 0.3
    tmux send-keys -t "$ORCHESTRATOR_PANE" "[$AGENT_NAME] セッション終了報告: 作業完了しました。詳細はログを参照してください。(Pane: $CURRENT_PANE)"
    sleep 0.3  # Enter送信前に待機（改行と見なされないように）
    tmux send-keys -t "$ORCHESTRATOR_PANE" Enter

    log "✅ Completion report sent to orchestrator"
fi

# 作業ログの保存
WORK_LOG="/Users/shunsuke/Dev/miyabi-private/.ai/logs/work-sessions/$AGENT_NAME-$(date +%Y%m%d-%H%M%S).json"
mkdir -p "$(dirname "$WORK_LOG")"

cat > "$WORK_LOG" <<EOF
{
  "agent_name": "$AGENT_NAME",
  "pane_id": "$CURRENT_PANE",
  "pane_index": $CURRENT_INDEX,
  "session_end_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "orchestrator_pane": "$ORCHESTRATOR_PANE",
  "status": "session_ended"
}
EOF

log "💾 Work log saved to $WORK_LOG"

# VOICEVOX通知（オプション）
if command -v osascript &>/dev/null; then
    osascript -e "display notification \"$AGENT_NAME がセッション終了。オーケストレーターに報告しました。\" with title \"🎨 Miyabi Agent\"" 2>/dev/null || true
fi

log "✅ Agent Session End Hook - COMPLETE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
