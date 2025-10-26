#!/bin/bash
# Stream Deck Shortcut: Rollback Deployment
# Usage: デプロイをロールバック

MESSAGE="Rollback the last deployment to the previous stable version"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "⏪ Rollback request sent to Claude Code"
