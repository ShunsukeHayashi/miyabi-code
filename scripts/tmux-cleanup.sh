#!/bin/bash
# Miyabi tmux Cleanup Script
# Generated: 2025-12-07

echo "🧹 Miyabi tmux Cleanup Starting..."
echo ""

# Sessions to kill
SESSIONS_TO_KILL=(
  "5"
  "7"
  "8"
  "aa"
  "a2a-demo"
  "a2a-worker"
  "omakaseai"
  "salon-society"
  "world-society"
  "agent-lab"
  "miyabi-main"
)

# Kill each session
for session in "${SESSIONS_TO_KILL[@]}"; do
  if tmux has-session -t "$session" 2>/dev/null; then
    tmux kill-session -t "$session"
    echo "  ✅ Killed: $session"
  else
    echo "  ⏭️  Skip: $session (not found)"
  fi
done

echo ""
echo "🧹 Cleanup complete!"
echo ""

# Show remaining sessions
remaining=$(tmux list-sessions 2>/dev/null | wc -l)
if [ "$remaining" -gt 0 ]; then
  echo "📋 Remaining sessions:"
  tmux list-sessions
else
  echo "✨ All sessions cleared!"
fi
