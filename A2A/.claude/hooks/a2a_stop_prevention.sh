#!/bin/bash
# A2A Stop Prevention Hook - 停止防止フック
# Claudeが停止しようとした時に呼ばれる

LOGFILE="${HOME}/.miyabi/logs/a2a-hooks.log"
mkdir -p "$(dirname "$LOGFILE")"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
AGENT_NAME="${A2A_AGENT_NAME:-agent}"

echo "[$TIMESTAMP] [Stop] Agent $AGENT_NAME stop detected" >> "$LOGFILE"

# 正常終了（exit 0）だが、stdoutに継続指示を出力
# Claude Codeはこの出力を見て次のアクションを決定可能
echo "[A2A] タスク完了。次のアクションがあれば継続してください。"

exit 0
