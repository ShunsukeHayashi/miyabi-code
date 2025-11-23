#!/bin/bash
# Stream Deck: Stop All
# Emergency stop all Miyabi processes

osascript -e 'display notification "全プロセス停止中..." with title "🛑 Stream Deck"'

# Kill all tmux sessions
tmux kill-server 2>/dev/null

# Kill Claude Code processes
pkill -f "claude" 2>/dev/null

# Kill cargo processes
pkill -f "cargo" 2>/dev/null

# Kill miyabi processes
pkill -f "miyabi" 2>/dev/null

osascript -e 'display notification "全プロセス停止完了" with title "✅ Stream Deck"'
