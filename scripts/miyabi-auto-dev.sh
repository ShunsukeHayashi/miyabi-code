#!/bin/bash
# Miyabi Fully Autonomous Development Mode
#
# 全自動開発モード - Issue取得からPR作成まで完全自動化
#
# Usage: ./scripts/miyabi-auto-dev.sh [options]
#   --concurrency N  : 並行実行するAgent数 (default: 4)
#   --max-issues N   : 処理する最大Issue数 (default: 無制限)
#   --dry-run        : ドライラン（実際の変更なし）

set -e

# =====================================
# Configuration
# =====================================
SESSION="miyabi-auto-dev"
WORKDIR="/Users/shunsuke/Dev/miyabi-private"
CONCURRENCY=${1:-4}
MAX_ISSUES=${2:-999}
DRY_RUN=${3:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================
# Functions
# =====================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check tmux
    if ! command -v tmux &> /dev/null; then
        log_error "tmux is not installed. Install with: brew install tmux"
        exit 1
    fi

    # Check miyabi CLI
    if [ ! -f "$WORKDIR/target/release/miyabi" ]; then
        log_error "Miyabi CLI not found. Build with: cargo build --release"
        exit 1
    fi

    # Use local binary (not PATH)
    export MIYABI_BIN="$WORKDIR/target/release/miyabi"

    # Check GITHUB_TOKEN
    if [ -z "$GITHUB_TOKEN" ]; then
        if [ -f "$WORKDIR/.env" ]; then
            source "$WORKDIR/.env"
        fi

        if [ -z "$GITHUB_TOKEN" ]; then
            log_error "GITHUB_TOKEN not set. Please set it in .env or environment."
            exit 1
        fi
    fi

    log_info "✓ All prerequisites met"
}

cleanup_existing_session() {
    if tmux has-session -t $SESSION 2>/dev/null; then
        log_warn "Existing session '$SESSION' found. Killing..."
        tmux kill-session -t $SESSION
    fi
}

create_coordinator_window() {
    log_info "Creating Coordinator window..."

    tmux new-session -d -s $SESSION -n "Coordinator" -c $WORKDIR
    tmux send-keys -t $SESSION:0 "clear" C-m
    tmux send-keys -t $SESSION:0 "echo '🤖 Miyabi Auto-Dev Mode - Coordinator Agent'" C-m
    tmux send-keys -t $SESSION:0 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
    tmux send-keys -t $SESSION:0 "echo 'Concurrency: $CONCURRENCY workers'" C-m
    tmux send-keys -t $SESSION:0 "echo 'Max Issues: $MAX_ISSUES'" C-m
    tmux send-keys -t $SESSION:0 "echo 'Dry Run: $DRY_RUN'" C-m
    tmux send-keys -t $SESSION:0 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
    tmux send-keys -t $SESSION:0 "" C-m

    # Start coordinator
    if [ "$DRY_RUN" == "true" ]; then
        tmux send-keys -t $SESSION:0 "echo '[DRY RUN] Would start: $MIYABI_BIN infinity --concurrency $CONCURRENCY'" C-m
    else
        tmux send-keys -t $SESSION:0 "$MIYABI_BIN infinity --concurrency $CONCURRENCY --max-issues $MAX_ISSUES" C-m
    fi
}

create_worker_windows() {
    log_info "Creating $CONCURRENCY worker windows..."

    for i in $(seq 1 $CONCURRENCY); do
        tmux new-window -t $SESSION -n "Worker-$i" -c $WORKDIR
        tmux send-keys -t $SESSION:$i "clear" C-m
        tmux send-keys -t $SESSION:$i "echo '⚙️  Worker Agent #$i - Waiting for tasks...'" C-m
        tmux send-keys -t $SESSION:$i "echo 'Worker is managed by Coordinator. Logs will appear here.'" C-m
        tmux send-keys -t $SESSION:$i "" C-m

        # Monitor worker logs
        tmux send-keys -t $SESSION:$i "tail -f .ai/logs/worker-$i.log 2>/dev/null || echo 'Waiting for first task...'" C-m
    done
}

create_review_window() {
    log_info "Creating Review & Test window..."

    WINDOW_ID=$((CONCURRENCY + 1))
    tmux new-window -t $SESSION -n "Review" -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID "clear" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "echo '🔍 Review & Quality Check'" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "" C-m

    # Split for parallel review + test
    tmux split-window -h -t $SESSION:$WINDOW_ID -c $WORKDIR

    # Left: Review logs
    tmux send-keys -t $SESSION:$WINDOW_ID.0 "watch -n 5 'find .ai/logs -name \"*review*.log\" -exec tail -20 {} \;'" C-m

    # Right: Test results
    tmux send-keys -t $SESSION:$WINDOW_ID.1 "watch -n 10 'cargo test --workspace 2>&1 | tail -30'" C-m
}

create_deploy_window() {
    log_info "Creating Deploy & PR window..."

    WINDOW_ID=$((CONCURRENCY + 2))
    tmux new-window -t $SESSION -n "Deploy" -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID "clear" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "echo '🚀 Deployment & PR Management'" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "" C-m

    # Split for PR list + Deploy logs
    tmux split-window -h -t $SESSION:$WINDOW_ID -c $WORKDIR

    # Left: PR list
    tmux send-keys -t $SESSION:$WINDOW_ID.0 "watch -n 30 'gh pr list --limit 10'" C-m

    # Right: Deploy logs
    tmux send-keys -t $SESSION:$WINDOW_ID.1 "tail -f .ai/logs/deploy.log 2>/dev/null || echo 'No deployments yet'" C-m
}

create_monitor_window() {
    log_info "Creating Monitor dashboard (4-pane)..."

    WINDOW_ID=$((CONCURRENCY + 3))
    tmux new-window -t $SESSION -n "Monitor" -c $WORKDIR

    # Top-left: Git status
    tmux send-keys -t $SESSION:$WINDOW_ID "watch -n 10 'git status --short'" C-m

    # Top-right: Issue status
    tmux split-window -h -t $SESSION:$WINDOW_ID -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID.1 "watch -n 30 'gh issue list --label agent:in-progress --limit 10'" C-m

    # Bottom-left: System resources
    tmux select-pane -t $SESSION:$WINDOW_ID.0
    tmux split-window -v -t $SESSION:$WINDOW_ID.0 -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID.2 "htop" C-m

    # Bottom-right: Main log tail
    tmux select-pane -t $SESSION:$WINDOW_ID.1
    tmux split-window -v -t $SESSION:$WINDOW_ID.1 -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID.3 "tail -f .ai/logs/$(date +%Y-%m-%d).log" C-m
}

create_voicevox_window() {
    log_info "Creating VOICEVOX notification window..."

    WINDOW_ID=$((CONCURRENCY + 4))
    tmux new-window -t $SESSION -n "Voice" -c $WORKDIR
    tmux send-keys -t $SESSION:$WINDOW_ID "clear" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "echo '🎤 VOICEVOX Narration System'" C-m
    tmux send-keys -t $SESSION:$WINDOW_ID "" C-m

    # Monitor VOICEVOX queue
    tmux send-keys -t $SESSION:$WINDOW_ID "watch -n 5 'ls -lht /tmp/voicevox_queue/ 2>/dev/null | head -20 || echo \"Queue empty\"'" C-m
}

print_summary() {
    cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Miyabi Auto-Dev Mode - Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: $SESSION
Workers: $CONCURRENCY
Max Issues: $MAX_ISSUES

Windows:
  0: Coordinator - Issue管理とタスク割り当て
  1-$CONCURRENCY: Worker Agents - 並行実装
  $((CONCURRENCY + 1)): Review & Test - 品質チェック
  $((CONCURRENCY + 2)): Deploy & PR - 自動デプロイ
  $((CONCURRENCY + 3)): Monitor - 4分割ダッシュボード
  $((CONCURRENCY + 4)): VOICEVOX - 音声通知

Controls:
  Ctrl-b n/p  - Next/Previous window
  Ctrl-b 0-9  - Jump to window
  Ctrl-b d    - Detach (continues in background)
  Ctrl-b :kill-session  - Stop all

Attaching to session in 3 seconds...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
    sleep 3
}

# =====================================
# Main Execution
# =====================================

main() {
    log_info "Starting Miyabi Fully Autonomous Development Mode..."

    check_prerequisites
    cleanup_existing_session

    create_coordinator_window
    create_worker_windows
    create_review_window
    create_deploy_window
    create_monitor_window
    create_voicevox_window

    # Select coordinator window
    tmux select-window -t $SESSION:0

    print_summary

    # Attach to session
    tmux attach -t $SESSION
}

# Run
main "$@"
