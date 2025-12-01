#!/bin/bash
# MUGEN OPS Tmux Session Setup
# ============================================================
# Creates 12 windows with 98 panes for OPS orchestration

set -euo pipefail

SESSION="miyabi-ops"

echo "🔧 Setting up MUGEN OPS tmux session: $SESSION"

# Check if session exists
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "❌ Session '$SESSION' not found! Creating new session..."
    tmux new-session -d -s "$SESSION" -n "monitor"
else
    echo "✅ Session '$SESSION' found."
fi

# Rename window 1
tmux rename-window -t "$SESSION:1" "monitor"

# Create window 2-12
echo "📊 Creating windows 2-12..."
tmux new-window -t "$SESSION:2" -n "summary"
tmux new-window -t "$SESSION:3" -n "⚡ Orchestra-A"
tmux new-window -t "$SESSION:4" -n "⚡ Orchestra-B"
tmux new-window -t "$SESSION:5" -n "⚡ Orchestra-C"
tmux new-window -t "$SESSION:6" -n "live-dashboard"
tmux new-window -t "$SESSION:7" -n "🔴 TeamA-CodingLead"
tmux new-window -t "$SESSION:8" -n "🟢 TeamB-CodingWork"
tmux new-window -t "$SESSION:9" -n "🔵 TeamC-Review"
tmux new-window -t "$SESSION:10" -n "🟡 TeamD-Business"
tmux new-window -t "$SESSION:11" -n "🟣 TeamE-Analytics"
tmux new-window -t "$SESSION:12" -n "🔍 Monitor"

# Create panes for each window
echo "🔀 Creating panes..."

# Window 7: TeamA - 6 panes (2x3 grid)
for i in {1..5}; do
    tmux split-window -t "$SESSION:7" -v
done
tmux select-layout -t "$SESSION:7" tiled

# Window 8: TeamB - 20 panes (4x5 grid)
for i in {1..19}; do
    tmux split-window -t "$SESSION:8" -v
done
tmux select-layout -t "$SESSION:8" tiled

# Window 9: TeamC - 20 panes (4x5 grid)
for i in {1..19}; do
    tmux split-window -t "$SESSION:9" -v
done
tmux select-layout -t "$SESSION:9" tiled

# Window 10: TeamD - 20 panes (4x5 grid)
for i in {1..19}; do
    tmux split-window -t "$SESSION:10" -v
done
tmux select-layout -t "$SESSION:10" tiled

# Window 11: TeamE - 20 panes (4x5 grid)
for i in {1..19}; do
    tmux split-window -t "$SESSION:11" -v
done
tmux select-layout -t "$SESSION:11" tiled

# Window 12: Monitor - 8 panes (2x4 grid)
for i in {1..7}; do
    tmux split-window -t "$SESSION:12" -v
done
tmux select-layout -t "$SESSION:12" tiled

echo "✅ MUGEN OPS tmux session setup complete!"
echo ""
echo "📊 Session structure:"
tmux list-windows -t "$SESSION"
echo ""
echo "🎯 Total panes: $(tmux list-panes -s -t "$SESSION" | wc -l)"
