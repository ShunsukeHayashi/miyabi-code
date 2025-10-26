#!/bin/bash
# Stream Deck Shortcut: Analyze Code
# Usage: コードベース全体を解析

MESSAGE="Analyze the codebase structure, dependencies, and architecture"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🔬 Code analysis request sent to Claude Code"
