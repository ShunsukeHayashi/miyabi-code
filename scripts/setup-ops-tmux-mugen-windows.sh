#!/bin/bash
# MUGEN OPS Tmux Session Setup - 98 Windows Version
# ============================================================
# Creates 98 windows for OPS orchestration

set -euo pipefail

SESSION="miyabi-ops"

echo "🔧 Setting up MUGEN OPS tmux session: $SESSION (98 windows)"

# Check if session exists, if yes, kill it
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

# Metrics Collection (Windows 7-14, 8 windows for metrics)
echo "📈 Creating metrics windows (7-14)..."
for i in {7..14}; do
    tmux new-window -t "$SESSION:$i" -n "$i:metric-$((i-6))"
done

# TeamA: Coding Lead (Windows 15-20, 6 agents)
echo "🔴 Creating TeamA windows (15-20)..."
for i in {15..20}; do
    tmux new-window -t "$SESSION:$i" -n "$i:TeamA-$((i-14))"
done

# TeamB: Coding Work (Windows 21-40, 20 agents)
echo "🟢 Creating TeamB windows (21-40)..."
for i in {21..40}; do
    tmux new-window -t "$SESSION:$i" -n "$i:TeamB-$((i-20))"
done

# TeamC: Review (Windows 41-60, 20 agents)
echo "🔵 Creating TeamC windows (41-60)..."
for i in {41..60}; do
    tmux new-window -t "$SESSION:$i" -n "$i:TeamC-$((i-40))"
done

# TeamD: Business (Windows 61-80, 20 agents)
echo "🟡 Creating TeamD windows (61-80)..."
for i in {61..80}; do
    tmux new-window -t "$SESSION:$i" -n "$i:TeamD-$((i-60))"
done

# TeamE: Analytics (Windows 81-100, 20 agents)
echo "🟣 Creating TeamE windows (81-100)..."
for i in {81..100}; do
    tmux new-window -t "$SESSION:$i" -n "$i:TeamE-$((i-80))"
done

echo ""
echo "✅ MUGEN OPS tmux session setup complete!"
echo ""
echo "📊 Session structure:"
tmux list-windows -t "$SESSION" | head -10
echo "..."
tmux list-windows -t "$SESSION" | tail -10
echo ""
echo "🎯 Total windows: $(tmux list-windows -t "$SESSION" | wc -l)"
