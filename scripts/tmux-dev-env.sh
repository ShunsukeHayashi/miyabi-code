#!/bin/bash
# Miyabi Development Environment - tmux Launcher
#
# Usage: ./scripts/tmux-dev-env.sh

set -e

SESSION="miyabi-dev-env"
WORKDIR="/Users/shunsuke/Dev/miyabi-private"

# Check if session exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? == 0 ]; then
    echo "⚠️  Session '$SESSION' already exists. Attaching..."
    tmux attach -t $SESSION
    exit 0
fi

echo "🚀 Starting Miyabi Development Environment..."

# Window 0: CLI Development
tmux new-session -d -s $SESSION -n "CLI" -c $WORKDIR
tmux send-keys -t $SESSION:0 "# Miyabi CLI Development" C-m
tmux send-keys -t $SESSION:0 "cargo watch -x 'build --package miyabi-cli'" C-m

# Window 1: Desktop App
tmux new-window -t $SESSION -n "Desktop" -c "$WORKDIR/miyabi-desktop"
tmux send-keys -t $SESSION:1 "# Miyabi Desktop (Tauri)" C-m
tmux send-keys -t $SESSION:1 "npm run dev" C-m

# Window 2: Agent Execution
tmux new-window -t $SESSION -n "Agents" -c $WORKDIR
tmux send-keys -t $SESSION:2 "# Agent Execution Monitor" C-m
tmux send-keys -t $SESSION:2 "watch -n 3 'ls -lht .ai/logs | head -20'" C-m

# Window 3: Tests (split)
tmux new-window -t $SESSION -n "Tests" -c $WORKDIR
tmux send-keys -t $SESSION:3 "# Continuous Testing" C-m
tmux split-window -h -t $SESSION:3 -c $WORKDIR
tmux send-keys -t $SESSION:3.0 "cargo watch -x 'test --lib'" C-m
tmux send-keys -t $SESSION:3.1 "cargo watch -x clippy" C-m

# Window 4: Git & Logs (quad split)
tmux new-window -t $SESSION -n "Monitor" -c $WORKDIR
tmux send-keys -t $SESSION:4 "git status" C-m
tmux split-window -h -t $SESSION:4 -c $WORKDIR
tmux send-keys -t $SESSION:4.1 "git log --oneline -10" C-m
tmux select-pane -t $SESSION:4.0
tmux split-window -v -t $SESSION:4.0 -c $WORKDIR
tmux send-keys -t $SESSION:4.2 "tail -f .ai/logs/$(date +%Y-%m-%d).log" C-m
tmux select-pane -t $SESSION:4.1
tmux split-window -v -t $SESSION:4.1 -c $WORKDIR
tmux send-keys -t $SESSION:4.3 "htop" C-m

# Window 5: Database/Services (if needed)
tmux new-window -t $SESSION -n "Services" -c $WORKDIR
tmux send-keys -t $SESSION:5 "# Start Qdrant (Knowledge DB)" C-m
tmux send-keys -t $SESSION:5 "# docker-compose up qdrant" C-m

# Select first window and attach
tmux select-window -t $SESSION:0
tmux attach -t $SESSION
