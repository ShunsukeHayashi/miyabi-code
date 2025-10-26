#!/bin/bash
# Stream Deck Shortcut: Profile Performance
# Usage: パフォーマンスプロファイリングを実行

MESSAGE="Profile the application performance and identify bottlenecks"

# Claude Codeに送信
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"

echo "⚡ Performance profiling request sent to Claude Code"
