#!/bin/bash
# tmux内でClaude Code & Codexを自動起動・実行するスクリプト
#
# Usage: ./scripts/tmux-claude-codex-runner.sh [task-file]

set -e

SESSION="claude-codex-auto"
WORKDIR="/Users/shunsuke/Dev/miyabi-private"
TASK_FILE="${1:-tasks/auto-dev-tasks.md}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 既存セッション削除
if tmux has-session -t $SESSION 2>/dev/null; then
    log_warn "Killing existing session: $SESSION"
    tmux kill-session -t $SESSION
fi

log_info "Starting Claude Code & Codex Auto-Runner..."

# =====================================
# Window 0: Claude Code - Feature Implementation
# =====================================
log_info "Creating Claude Code window (Feature Implementation)..."

tmux new-session -d -s $SESSION -n "Claude-Feature" -c $WORKDIR

# Claude Codeでタスク実行
tmux send-keys -t $SESSION:0 "clear" C-m
tmux send-keys -t $SESSION:0 "echo '🤖 Claude Code - Feature Implementation'" C-m
tmux send-keys -t $SESSION:0 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:0 "" C-m

# Claude Codeを起動してインストラクション実行
# 方法1: パイプ経由
tmux send-keys -t $SESSION:0 "cat tasks/claude-feature-task.md | claude --stdin" C-m

# =====================================
# Window 1: Claude Code - Bug Fix
# =====================================
log_info "Creating Claude Code window (Bug Fix)..."

tmux new-window -t $SESSION -n "Claude-BugFix" -c $WORKDIR
tmux send-keys -t $SESSION:1 "clear" C-m
tmux send-keys -t $SESSION:1 "echo '🐛 Claude Code - Bug Fix'" C-m
tmux send-keys -t $SESSION:1 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:1 "" C-m

# Bug修正タスク実行
tmux send-keys -t $SESSION:1 "cat tasks/claude-bugfix-task.md | claude --stdin" C-m

# =====================================
# Window 2: Codex Task Runner #1
# =====================================
log_info "Creating Codex window #1..."

tmux new-window -t $SESSION -n "Codex-1" -c $WORKDIR
tmux send-keys -t $SESSION:2 "clear" C-m
tmux send-keys -t $SESSION:2 "echo '⚙️  GitHub Codex - Task Runner #1'" C-m
tmux send-keys -t $SESSION:2 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:2 "" C-m

# Codexタスク実行
tmux send-keys -t $SESSION:2 "./scripts/codex-task-runner.sh start --task-id feature-auth --instructions tasks/codex-auth-task.md --type feature" C-m

# =====================================
# Window 3: Codex Task Runner #2
# =====================================
log_info "Creating Codex window #2..."

tmux new-window -t $SESSION -n "Codex-2" -c $WORKDIR
tmux send-keys -t $SESSION:3 "clear" C-m
tmux send-keys -t $SESSION:3 "echo '⚙️  GitHub Codex - Task Runner #2'" C-m
tmux send-keys -t $SESSION:3 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:3 "" C-m

# Codexタスク実行
tmux send-keys -t $SESSION:3 "./scripts/codex-task-runner.sh start --task-id refactor-api --instructions tasks/codex-refactor-task.md --type refactor" C-m

# =====================================
# Window 4: Monitor - 4分割
# =====================================
log_info "Creating Monitor dashboard..."

tmux new-window -t $SESSION -n "Monitor" -c $WORKDIR

# Top-left: Claude Code status
tmux send-keys -t $SESSION:4 "watch -n 5 'ps aux | grep claude | grep -v grep'" C-m

# Top-right: Codex status
tmux split-window -h -t $SESSION:4 -c $WORKDIR
tmux send-keys -t $SESSION:4.1 "watch -n 5 'ls -lht .ai/codex-tasks/ | head -20'" C-m

# Bottom-left: Git status
tmux select-pane -t $SESSION:4.0
tmux split-window -v -t $SESSION:4.0 -c $WORKDIR
tmux send-keys -t $SESSION:4.2 "watch -n 10 'git status --short'" C-m

# Bottom-right: Logs
tmux select-pane -t $SESSION:4.1
tmux split-window -v -t $SESSION:4.1 -c $WORKDIR
tmux send-keys -t $SESSION:4.3 "tail -f .ai/logs/$(date +%Y-%m-%d).log" C-m

# =====================================
# Window 5: Results Viewer
# =====================================
log_info "Creating Results viewer..."

tmux new-window -t $SESSION -n "Results" -c $WORKDIR
tmux send-keys -t $SESSION:5 "clear" C-m
tmux send-keys -t $SESSION:5 "echo '📊 Execution Results'" C-m
tmux send-keys -t $SESSION:5 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION:5 "" C-m

# 結果を定期的に表示
tmux send-keys -t $SESSION:5 "watch -n 30 './scripts/codex-task-runner.sh status'" C-m

# =====================================
# Summary
# =====================================

tmux select-window -t $SESSION:0

cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Claude Code & Codex Auto-Runner - Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: $SESSION

Windows:
  0: Claude Code - Feature Implementation
  1: Claude Code - Bug Fix
  2: Codex Task Runner #1 (feature-auth)
  3: Codex Task Runner #2 (refactor-api)
  4: Monitor (4分割)
  5: Results Viewer

Controls:
  Ctrl-b n/p  - Next/Previous window
  Ctrl-b 0-5  - Jump to window
  Ctrl-b d    - Detach

Attaching to session in 3 seconds...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

sleep 3
log_success "Attaching to session..."
tmux attach -t $SESSION
