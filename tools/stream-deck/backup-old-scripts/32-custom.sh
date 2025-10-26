#!/bin/bash
# Stream Deck Shortcut: Custom Command
# Usage: カスタムコマンドを実行（引数で指定）

CUSTOM_MESSAGE="${1:-Show available custom commands}"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$CUSTOM_MESSAGE"

echo "⚙️ Custom command sent to Claude Code: $CUSTOM_MESSAGE"
