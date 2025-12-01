#!/bin/bash
# MUGEN OPS Tmux Session Setup - Consolidated Windows
# ============================================================
# 19 windows with multiple panes per team

set -euo pipefail

SESSION="miyabi-ops"

echo "🔧 Setting up MUGEN OPS tmux session: $SESSION (Consolidated - 19 windows)"

# Kill existing session if it exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "🔄 Killing existing session '$SESSION'..."
    tmux kill-session -t "$SESSION"
fi

echo "✨ Creating new session '$SESSION'..."
tmux new-session -d -s "$SESSION" -n "1:monitor"

# OPS Components (Windows 1-6)
echo "📊 Creating OPS component windows (1-6)..."
tmux new-window -t "$SESSION:2" -n "2:summary"
tmux new-window -t "$SESSION:3" -n "3:deploy"
tmux new-window -t "$SESSION:4" -n "4:incident"
tmux new-window -t "$SESSION:5" -n "5:backup"
tmux new-window -t "$SESSION:6" -n "6:dashboard"

# Metrics Collection (Windows 7-14, 8 windows)
echo "📈 Creating metrics windows (7-14)..."
for i in {7..14}; do
    tmux new-window -t "$SESSION:$i" -n "$i:metric-$((i-6))"
done

# TeamA: Coding Lead (Window 15, 6 panes)
echo "🔴 Creating TeamA window (15) with 6 panes..."
tmux new-window -t "$SESSION:15" -n "15:🔴TeamA"
for i in {1..5}; do
    tmux split-window -t "$SESSION:15" -v
done
tmux select-layout -t "$SESSION:15" tiled

# TeamB: Coding Work (Window 16, 20 panes)
echo "🟢 Creating TeamB window (16) with 20 panes..."
tmux new-window -t "$SESSION:16" -n "16:🟢TeamB"
for i in {1..19}; do
    tmux split-window -t "$SESSION:16" -v
done
tmux select-layout -t "$SESSION:16" tiled

# TeamC: Review (Window 17, 20 panes)
echo "🔵 Creating TeamC window (17) with 20 panes..."
tmux new-window -t "$SESSION:17" -n "17:🔵TeamC"
for i in {1..19}; do
    tmux split-window -t "$SESSION:17" -v
done
tmux select-layout -t "$SESSION:17" tiled

# TeamD: Business (Window 18, 20 panes)
echo "🟡 Creating TeamD window (18) with 20 panes..."
tmux new-window -t "$SESSION:18" -n "18:🟡TeamD"
for i in {1..19}; do
    tmux split-window -t "$SESSION:18" -v
done
tmux select-layout -t "$SESSION:18" tiled

# TeamE: Analytics (Window 19, 20 panes)
echo "🟣 Creating TeamE window (19) with 20 panes..."
tmux new-window -t "$SESSION:19" -n "19:🟣TeamE"
for i in {1..19}; do
    tmux split-window -t "$SESSION:19" -v
done
tmux select-layout -t "$SESSION:19" tiled

echo ""
echo "✅ MUGEN OPS tmux session setup complete!"
echo ""
echo "📊 Session structure:"
tmux list-windows -t "$SESSION"
echo ""
echo "🎯 Total windows: $(tmux list-windows -t "$SESSION" | wc -l)"
echo "🎯 Total panes: $(tmux list-panes -s -t "$SESSION" | wc -l)"
