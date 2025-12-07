#!/bin/bash
# ============================================================
# Miyabi OSS Orchestration - tmux Session Initializer
# ============================================================
# Usage: ./init-miyabi-oss.sh
# ============================================================

set -e

SESSION="miyabi-oss"
PROJECT_DIR="${MIYABI_ROOT:-$HOME/Dev/01-miyabi/_core/miyabi-private}"

echo "🚀 Initializing Miyabi OSS Orchestration..."
echo ""

# ============================================================
# 1. Create Main Session with Conductor Window
# ============================================================
echo "📦 Creating session: $SESSION"
tmux new-session -d -s "$SESSION" -n conductor -c "$PROJECT_DIR"

# ============================================================
# 2. Create Agent Windows
# ============================================================
echo "🤖 Creating agent windows..."

# CodeGen agents (parallel execution)
tmux new-window -t "$SESSION" -n codegen-1 -c "$PROJECT_DIR"
tmux new-window -t "$SESSION" -n codegen-2 -c "$PROJECT_DIR"
tmux new-window -t "$SESSION" -n codegen-3 -c "$PROJECT_DIR"

# Review agent
tmux new-window -t "$SESSION" -n review -c "$PROJECT_DIR"

# PR agent
tmux new-window -t "$SESSION" -n pr -c "$PROJECT_DIR"

# Deploy agent
tmux new-window -t "$SESSION" -n deploy -c "$PROJECT_DIR"

# Monitoring window
tmux new-window -t "$SESSION" -n monitor -c "$PROJECT_DIR"

# ============================================================
# 3. Generate Pane ID Mapping
# ============================================================
echo "📋 Generating pane ID mapping..."
mkdir -p ~/.miyabi

tmux list-panes -a -F "#{session_name}:#{window_name} #{pane_id} #{pane_current_command}" | \
  grep "^$SESSION" > ~/.miyabi/pane_map.txt

echo ""
echo "📋 Pane Mapping:"
cat ~/.miyabi/pane_map.txt
echo ""

# ============================================================
# 4. Summary
# ============================================================
echo "============================================================"
echo "✅ Miyabi OSS Orchestration Ready!"
echo "============================================================"
echo ""
echo "Session: $SESSION"
echo "Windows:"
tmux list-windows -t "$SESSION" -F "  #{window_index}: #{window_name}"
echo ""
echo "Commands:"
echo "  Attach:  tmux attach -t $SESSION"
echo "  List:    tmux list-panes -a"
echo "  Kill:    tmux kill-session -t $SESSION"
echo ""
echo "🎯 Next: Run 'tmux attach -t $SESSION' to start orchestrating!"
