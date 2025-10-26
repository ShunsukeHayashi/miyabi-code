#!/bin/bash
# Stream Deck Shortcut: View Logs
# Usage: アプリケーションログを表示

cd "$(dirname "$0")/../.." || exit 1

echo "📝 Viewing logs..."

# ログディレクトリの確認
if [ -d "logs" ]; then
    # ログディレクトリがある場合
    echo "Recent log files:"
    ls -lht logs/ | head -10

    # 最新のログを表示
    LATEST_LOG=$(ls -t logs/*.log 2>/dev/null | head -1)
    if [ -n "$LATEST_LOG" ]; then
        echo ""
        echo "=== Latest log: $LATEST_LOG ==="
        tail -50 "$LATEST_LOG"

        # Claude Codeに表示を依頼
        MESSAGE="Show and analyze the latest application logs from $LATEST_LOG"
        $(dirname "$0")/05-send-to-claude.sh "$MESSAGE"
    fi
else
    # /tmpディレクトリ内のMiyabiログを表示
    echo "Miyabi logs in /tmp:"
    ls -lht /tmp/miyabi-*.log 2>/dev/null | head -10

    MESSAGE="View and analyze Miyabi logs in /tmp directory"
    $(dirname "$0")/05-send-to-claude.sh "$MESSAGE"
fi

echo "✅ Log viewing request sent to Claude Code"
