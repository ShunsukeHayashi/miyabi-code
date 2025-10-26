#!/bin/bash
# Stream Deck Shortcut: Run Deploy Agent
# Usage: Deploy Agentを実行（Claude Codeに指示を送信）

MESSAGE="Run the Deploy agent to handle deployment tasks"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🚢 Deploy Agent request sent to Claude Code"
