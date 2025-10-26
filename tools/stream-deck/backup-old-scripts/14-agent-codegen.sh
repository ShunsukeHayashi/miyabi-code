#!/bin/bash
# Stream Deck Shortcut: Run CodeGen Agent
# Usage: CodeGen Agentを実行（Claude Codeに指示を送信）

MESSAGE="Run the CodeGen agent to generate code based on the current requirements"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "⚙️ CodeGen Agent request sent to Claude Code"
