#!/bin/bash
# Reliable tmux send-keys with Enter confirmation
# Purpose: Ensure Enter key is properly sent to tmux panes

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <target_pane> <command>"
    echo "Example: $0 Miyabi:1.4 'codex'"
    exit 1
fi

TARGET="$1"
COMMAND="$2"
RETRY="${3:-3}"  # デフォルト3回リトライ

# 確実にEnterキーを送信
send_with_retry() {
    local target="$1"
    local cmd="$2"
    local attempts="$3"

    for i in $(seq 1 $attempts); do
        # コマンド送信
        tmux send-keys -t "$target" "$cmd" 2>/dev/null || true
        sleep 0.8

        # Enterキー送信（複数回）
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3

        # 送信確認
        local output=$(tmux capture-pane -t "$target" -p | tail -5)

        # プロンプトが表示されているかチェック
        if echo "$output" | grep -q "❯\|>\|$"; then
            echo "✅ コマンド送信成功: $cmd"
            return 0
        fi

        echo "⚠️ リトライ $i/$attempts..."
        sleep 0.5
    done

    echo "❌ コマンド送信失敗: $cmd"
    return 1
}

send_with_retry "$TARGET" "$COMMAND" "$RETRY"
