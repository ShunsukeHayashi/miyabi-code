#!/bin/bash
# デモ: Claude Code & Codex リアルタイム実行表示
#
# このスクリプトはClaude Code/Codexの実行をシミュレートし、
# リアルタイムで進捗を表示します

set -e

SESSION="demo-live"
WORKDIR="/Users/shunsuke/Dev/miyabi-private"

# Cleanup existing session
tmux kill-session -t $SESSION 2>/dev/null || true

echo "🚀 Starting LIVE Demo..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 2

# Create session
tmux new-session -d -s $SESSION -n "Claude-Code-1" -c $WORKDIR

# Window 0: Claude Code実行シミュレーション
tmux send-keys -t $SESSION:0 "clear" C-m
tmux send-keys -t $SESSION:0 "echo '🤖 Claude Code - Task Execution'" C-m
tmux send-keys -t $SESSION:0 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:0 "echo 'Task: Implement health check endpoint'" C-m
tmux send-keys -t $SESSION:0 "echo 'Status: Executing...'" C-m
tmux send-keys -t $SESSION:0 "echo ''" C-m

# シミュレーション: ファイル作成
tmux send-keys -t $SESSION:0 "sleep 2" C-m
tmux send-keys -t $SESSION:0 "echo '[1/5] Analyzing requirements...'" C-m
tmux send-keys -t $SESSION:0 "sleep 3" C-m
tmux send-keys -t $SESSION:0 "echo '[2/5] Creating health.rs...'" C-m
tmux send-keys -t $SESSION:0 "sleep 2" C-m
tmux send-keys -t $SESSION:0 "echo '[3/5] Adding route...'" C-m
tmux send-keys -t $SESSION:0 "sleep 2" C-m
tmux send-keys -t $SESSION:0 "echo '[4/5] Running tests...'" C-m
tmux send-keys -t $SESSION:0 "sleep 3" C-m
tmux send-keys -t $SESSION:0 "echo '[5/5] ✅ Complete!'" C-m

# Window 1: Codex実行
tmux new-window -t $SESSION -n "Codex-Runner" -c $WORKDIR
tmux send-keys -t $SESSION:1 "clear" C-m
tmux send-keys -t $SESSION:1 "echo '⚙️  GitHub Codex - Task Runner'" C-m
tmux send-keys -t $SESSION:1 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:1 "echo 'Task ID: feature-auth'" C-m
tmux send-keys -t $SESSION:1 "echo 'Type: Feature Implementation'" C-m
tmux send-keys -t $SESSION:1 "echo ''" C-m
tmux send-keys -t $SESSION:1 "sleep 2" C-m
tmux send-keys -t $SESSION:1 "echo 'Initializing task...'" C-m
tmux send-keys -t $SESSION:1 "sleep 2" C-m
tmux send-keys -t $SESSION:1 "echo 'Creating .ai/codex-tasks/feature-auth/'" C-m
tmux send-keys -t $SESSION:1 "mkdir -p .ai/codex-tasks/feature-auth" C-m
tmux send-keys -t $SESSION:1 "sleep 1" C-m
tmux send-keys -t $SESSION:1 "echo 'Progress: 0% -> 25%'" C-m
tmux send-keys -t $SESSION:1 "sleep 3" C-m
tmux send-keys -t $SESSION:1 "echo 'Progress: 25% -> 50%'" C-m
tmux send-keys -t $SESSION:1 "sleep 3" C-m
tmux send-keys -t $SESSION:1 "echo 'Progress: 50% -> 75%'" C-m
tmux send-keys -t $SESSION:1 "sleep 3" C-m
tmux send-keys -t $SESSION:1 "echo 'Progress: 75% -> 100%'" C-m
tmux send-keys -t $SESSION:1 "sleep 2" C-m
tmux send-keys -t $SESSION:1 "echo '✅ Task completed successfully!'" C-m

# Window 2: Live Monitor
tmux new-window -t $SESSION -n "Live-Monitor" -c $WORKDIR
tmux send-keys -t $SESSION:2 "clear" C-m
tmux send-keys -t $SESSION:2 "echo '📊 Live Execution Monitor'" C-m
tmux send-keys -t $SESSION:2 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:2 "echo ''" C-m

# Split for multi-view
tmux split-window -h -t $SESSION:2
tmux send-keys -t $SESSION:2.0 "watch -n 2 'tmux capture-pane -t $SESSION:0 -p | tail -15'" C-m
tmux send-keys -t $SESSION:2.1 "watch -n 2 'tmux capture-pane -t $SESSION:1 -p | tail -15'" C-m

tmux select-window -t $SESSION:0

echo "✅ Demo session created: $SESSION"
echo ""
echo "Available windows:"
echo "  0: Claude Code execution"
echo "  1: Codex task runner"
echo "  2: Live monitor (split view)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Attaching to session... (Ctrl-b d to detach)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 3
tmux attach -t $SESSION
