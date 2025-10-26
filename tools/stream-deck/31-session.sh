#!/bin/bash
# Stream Deck Shortcut: Session End
# Usage: セッション終了処理を実行

MESSAGE="/session-end"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🔄 Session end request sent to Claude Code"
