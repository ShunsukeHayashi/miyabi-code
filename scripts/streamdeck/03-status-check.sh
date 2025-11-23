#!/bin/bash
# Stream Deck: Status Check
# Comprehensive system health check

STATUS_FILE="/tmp/miyabi-status.txt"

{
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎯 Miyabi System Status Report"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Git Status
  echo "📁 Git Status:"
  cd ~/Dev/miyabi-private
  git status -s | head -5
  echo ""

  # tmux Sessions
  echo "🎭 tmux Sessions:"
  tmux list-sessions 2>/dev/null || echo "  No active sessions"
  echo ""

  # System Resources
  echo "💻 System Resources:"
  echo "  CPU: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')"
  echo "  Memory: $(top -l 1 | grep PhysMem | awk '{print $2}')"
  echo "  Disk: $(df -h ~ | tail -1 | awk '{print $5 " used"}')"
  echo ""

  # Running Processes
  echo "⚙️  Miyabi Processes:"
  ps aux | grep -E "claude|miyabi|cargo" | grep -v grep | wc -l | xargs echo "  Active:"
  echo ""

  echo "✅ Status check complete"
  echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
} > "$STATUS_FILE"

# Display in terminal
osascript <<EOF
tell application "Terminal"
    activate
    do script "cat $STATUS_FILE && rm $STATUS_FILE"
end tell
EOF

osascript -e 'display notification "システム状態を確認中..." with title "📊 Stream Deck"'
