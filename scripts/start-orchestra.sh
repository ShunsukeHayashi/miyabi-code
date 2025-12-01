#!/bin/bash
# =============================================================================
# Miyabi 172-Agent Orchestra Startup Script
# =============================================================================
# 全オーケストラを起動し、コミュニケーションプロトコルを展開
# Usage: ./start-orchestra.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SESSION="miyabi-deploy"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Phase 1: ログファイル初期化
# =============================================================================
init_logs() {
    log_info "Initializing log files..."

    # ログディレクトリ作成
    mkdir -p /tmp/miyabi-orchestra

    # オーケストラログ初期化
    echo "=== Orchestra-A Log Started $(date) ===" > /tmp/orchestra-a-status.log
    echo "=== Orchestra-B Log Started $(date) ===" > /tmp/orchestra-b-status.log
    echo "=== Orchestra-C Log Started $(date) ===" > /tmp/orchestra-c-status.log
    echo "=== Grand Orchestrator Log Started $(date) ===" > /tmp/grand-orchestrator.log

    log_success "Log files initialized"
}

# =============================================================================
# Phase 2: Orchestrator Instructions 送信
# =============================================================================
send_orchestrator_instructions() {
    log_info "Sending instructions to Orchestrators..."

    # Orchestra-A (Agent-001 = 最初のClaude on MUGEN)
    local orch_a_pane=$(tmux list-panes -t $SESSION -a -F "#{pane_id}" | head -1)
    if [ -n "$orch_a_pane" ]; then
        log_info "Sending to Orchestra-A (pane $orch_a_pane)..."
        tmux send-keys -t "$orch_a_pane" "cat $SCRIPT_DIR/orchestra-instructions/orchestrator-a-instruction.md" Enter
        sleep 1
        tmux send-keys -t "$orch_a_pane" "" Enter  # 改行で読み込み完了
    fi

    # Orchestra-B Orchestrator window
    log_info "Sending to Orchestra-B window..."
    tmux send-keys -t $SESSION:orchestra-b "cat $SCRIPT_DIR/orchestra-instructions/orchestrator-b-instruction.md && echo '--- BEGIN OPERATIONS ---'" Enter

    # Orchestra-C Orchestrator window
    log_info "Sending to Orchestra-C window..."
    tmux send-keys -t $SESSION:orchestra-c "cat $SCRIPT_DIR/orchestra-instructions/orchestrator-c-instruction.md && echo '--- BEGIN OPERATIONS ---'" Enter

    log_success "Orchestrator instructions sent"
}

# =============================================================================
# Phase 3: Worker Instructions 展開
# =============================================================================
send_worker_instructions() {
    log_info "Broadcasting worker instructions to all agent panes..."

    # 全ペインにWorker Instructionの要約を送信
    local worker_summary=$(cat << 'EOF'
# WORKER PROTOCOL ACTIVE
# Report to your Team Lead:
# - ACK: Task received
# - STATUS: Every 15 min or 50% progress
# - DONE: Task complete
# - BLOCKED: Issue encountered
# - HELP: Need assistance
#
# Format: [TIMESTAMP] Agent-XXX → Lead: [TYPE] | [message]
# Log to: /tmp/agent-XXX.log
EOF
)

    # mugenとmajinウィンドウの全ペインに送信
    for window in $(tmux list-windows -t $SESSION -F "#{window_name}" | grep -E "mugen|majin|codex"); do
        for pane in $(tmux list-panes -t $SESSION:$window -F "#{pane_id}"); do
            tmux send-keys -t "$pane" "echo '$worker_summary'" Enter 2>/dev/null || true
        done
    done

    log_success "Worker instructions broadcast complete"
}

# =============================================================================
# Phase 4: 初期タスク配布
# =============================================================================
distribute_initial_tasks() {
    log_info "Distributing initial tasks..."

    # Orchestra-A: Infrastructure tasks
    log_info "Assigning Infrastructure tasks to Orchestra-A..."
    tmux send-keys -t $SESSION:orchestra-a "echo '[$(date +%H:%M:%S)] Orchestrator-A: TASK | Team A1, begin Lambda deployment (#832)'" Enter

    # Orchestra-B: Development tasks
    log_info "Assigning Development tasks to Orchestra-B..."
    tmux send-keys -t $SESSION:orchestra-b "echo '[$(date +%H:%M:%S)] Orchestrator-B: TASK | Team B3, begin Database schema design'" Enter

    # Orchestra-C: Business tasks
    log_info "Assigning Business tasks to Orchestra-C..."
    tmux send-keys -t $SESSION:orchestra-c "echo '[$(date +%H:%M:%S)] Orchestrator-C: TASK | Team C2, begin Executive Summary'" Enter

    log_success "Initial tasks distributed"
}

# =============================================================================
# Phase 5: モニタリング開始
# =============================================================================
start_monitoring() {
    log_info "Starting monitoring systems..."

    # Summary windowでステータス監視
    tmux send-keys -t $SESSION:summary "watch -n 10 'cat /tmp/orchestra-*.log | tail -20'" Enter 2>/dev/null || true

    # Live Dashboard は既に起動済み

    log_success "Monitoring systems started"
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          🎭 MIYABI 172-AGENT ORCHESTRA STARTUP                   ║${NC}"
    echo -e "${CYAN}║                     $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # セッション確認
    if ! tmux has-session -t $SESSION 2>/dev/null; then
        log_error "Session '$SESSION' not found. Please create it first."
        exit 1
    fi

    # 実行
    init_logs
    echo ""

    send_orchestrator_instructions
    echo ""

    send_worker_instructions
    echo ""

    distribute_initial_tasks
    echo ""

    start_monitoring
    echo ""

    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ ORCHESTRA STARTUP COMPLETE                           ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  3 Orchestrators initialized                                     ║${NC}"
    echo -e "${GREEN}║  172 Agents ready                                                ║${NC}"
    echo -e "${GREEN}║  Communication protocol active                                   ║${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}║  Monitoring:                                                     ║${NC}"
    echo -e "${GREEN}║    tmux select-window -t miyabi-deploy:live-dashboard            ║${NC}"
    echo -e "${GREEN}║    tmux select-window -t miyabi-deploy:summary                   ║${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}║  Auto-rotate:                                                    ║${NC}"
    echo -e "${GREEN}║    ./scripts/tmux-auto-rotate.sh 5 orchestras                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

main "$@"
