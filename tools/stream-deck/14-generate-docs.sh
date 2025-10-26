#!/bin/bash
# Stream Deck Shortcut: Generate Documentation
# Usage: プロジェクトドキュメントを生成

MESSAGE="Generate documentation for the project using /generate-docs"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "📚 Documentation generation request sent to Claude Code"
