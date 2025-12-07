#!/bin/bash
# A2A PostToolUse Hook - ツール実行後の自動継続

LOGFILE="${HOME}/.miyabi/logs/a2a-hooks.log"
mkdir -p "$(dirname "$LOGFILE")"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
AGENT_NAME="${A2A_AGENT_NAME:-$(hostname)}"
PANE_ID="${A2A_PANE_ID:-unknown}"

echo "[$TIMESTAMP] [PostToolUse] Agent: $AGENT_NAME, Pane: $PANE_ID" >> "$LOGFILE"

# タスク継続のリマインダーを出力（stdoutに出力するとClaudeが見る）
if [[ -n "$A2A_AUTONOMOUS" ]]; then
    echo "[A2A] タスク継続: 次のアクションを実行してください"
fi

exit 0
