#!/bin/bash
# Stream Deck Shortcut: Deploy to Production
# Usage: 本番環境へのデプロイを実行

MESSAGE="Deploy to production using /deploy command"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🌐 Production deployment request sent to Claude Code"
