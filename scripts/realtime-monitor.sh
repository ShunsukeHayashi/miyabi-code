#!/bin/bash
# リアルタイムtmux出力モニター
# Usage: ./scripts/realtime-monitor.sh <session-name>

SESSION="${1:-claude-codex-auto}"
REFRESH_INTERVAL=3

clear

while true; do
    clear
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔴 LIVE: Claude Code & Codex - Real-time Monitor"
    echo "Session: $SESSION | Refresh: ${REFRESH_INTERVAL}s"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check session exists
    if ! tmux has-session -t $SESSION 2>/dev/null; then
        echo "❌ Session '$SESSION' not found"
        echo ""
        echo "Available sessions:"
        tmux ls 2>&1
        sleep 5
        continue
    fi

    # Get window list
    WINDOWS=$(tmux list-windows -t $SESSION -F "#{window_index}:#{window_name}")

    for WINDOW in $WINDOWS; do
        WINDOW_ID=$(echo $WINDOW | cut -d: -f1)
        WINDOW_NAME=$(echo $WINDOW | cut -d: -f2)

        echo "┌─────────────────────────────────────────────────────────────┐"
        echo "│ Window $WINDOW_ID: $WINDOW_NAME"
        echo "└─────────────────────────────────────────────────────────────┘"

        # Capture last 10 lines from window
        tmux capture-pane -t $SESSION:$WINDOW_ID -p | tail -10
        echo ""
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Press Ctrl-C to stop monitoring"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    sleep $REFRESH_INTERVAL
done
