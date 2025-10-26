#!/bin/bash
# Stream Deck Shortcut: Run Coordinator Agent
# Usage: Coordinator Agentを実行（Claude Codeに指示を送信）

MESSAGE="Run the Coordinator agent to analyze and coordinate the next task"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🎯 Coordinator Agent request sent to Claude Code"
