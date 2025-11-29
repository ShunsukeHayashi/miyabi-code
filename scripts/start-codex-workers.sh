#!/bin/bash
# Codex Worker 一括起動

echo "🚀 Codex Workers 起動中..."

STARTED=0
for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    SESSION_NAME="codex-worker-$NUM"
    AGENT_DIR="/home/agent-$NUM"
    
    # 既存セッションがなければ作成
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        tmux new-session -d -s "$SESSION_NAME" -c "$AGENT_DIR"
        tmux send-keys -t "$SESSION_NAME" "cd /home/ubuntu/miyabi-private && codex --model o4-mini --approval-mode full-auto" Enter
        ((STARTED++))
        
        # 10匹ごとに表示
        if [ $((STARTED % 10)) -eq 0 ]; then
            echo "  ✅ $STARTED/100 workers started"
        fi
    fi
done

echo ""
echo "🎉 $STARTED Codex workers 起動完了！"
