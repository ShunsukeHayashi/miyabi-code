#!/bin/bash
# A2A Keepalive Hook
# エージェントが止まらないようにする監視スクリプト

LOGFILE="${HOME}/.miyabi/logs/a2a-keepalive.log"
mkdir -p "$(dirname "$LOGFILE")"

AGENT_NAME="${A2A_AGENT_NAME:-unknown}"
PANE_ID="${A2A_PANE_ID:-unknown}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] [$AGENT_NAME] Hook triggered on pane $PANE_ID" >> "$LOGFILE"

# 自分以外のエージェントペインをチェックして、止まっていたら再起動を促す
check_agent_health() {
    local pane=$1
    local agent=$2

    # ペインの最新出力を取得
    local output=$(tmux capture-pane -t "$pane" -p 2>/dev/null | tail -3)

    # プロンプト待ち状態（止まっている）かチェック
    if echo "$output" | grep -q "^> $"; then
        echo "[$TIMESTAMP] [$agent] Idle detected on $pane - sending keepalive" >> "$LOGFILE"
        # キープアライブメッセージを送信
        tmux send-keys -t "$pane" "[Keepalive] 状態を確認してください。タスクがあれば実行、なければ監視を継続。" Enter
    fi
}

# バックグラウンドで他エージェントの状態をチェック（非ブロッキング）
(
    sleep 2
    # 定義されたペインIDをチェック
    for pane in %89 %90 %91 %92 %93; do
        if [[ "$pane" != "$PANE_ID" ]]; then
            check_agent_health "$pane" "agent"
        fi
    done
) &

exit 0
