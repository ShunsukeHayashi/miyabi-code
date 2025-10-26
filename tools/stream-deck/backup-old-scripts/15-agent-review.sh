#!/bin/bash
# Stream Deck Shortcut: Run Review Agent
# Usage: Review Agentを実行（Claude Codeに指示を送信）

MESSAGE="Run the Review agent to review the code changes and provide feedback"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🔍 Review Agent request sent to Claude Code"
