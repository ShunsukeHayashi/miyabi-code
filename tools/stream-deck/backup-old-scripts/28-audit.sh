#!/bin/bash
# Stream Deck Shortcut: Security Audit
# Usage: セキュリティ監査を実行

MESSAGE="Run security audit using /security-scan command"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "🔒 Security audit request sent to Claude Code"
