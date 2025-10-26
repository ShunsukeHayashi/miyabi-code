#!/bin/bash
# Stream Deck Shortcut: Monitor System
# Usage: システム状態のモニタリング

MESSAGE="Monitor system resources, running processes, and application health"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "📡 System monitoring request sent to Claude Code"
