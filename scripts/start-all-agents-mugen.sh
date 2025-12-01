#!/bin/bash
# Start All Agents on MUGEN - 86 Claude Code / Codex Instances
# ============================================================

set -euo pipefail

SESSION="miyabi-ops"
PROJECT_ROOT="/home/ubuntu/miyabi-private"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Send command to window
send_to_window() {
    local window=$1
    local command=$2
    tmux send-keys -t "${SESSION}:${window}" "$command" C-m
}

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║    Starting ALL Agents - 86 Claude Code Instances       ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check session exists
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo -e "${RED}[ERROR]${NC} Session '$SESSION' not found!"
    exit 1
fi

log_info "Session '$SESSION' found. Starting all agents..."
echo ""

# ============================================================
# TeamA: Coding Lead (Windows 15-20, 6 agents)
# ============================================================
log_info "🔴 Starting TeamA: Coding Lead (6 agents, Windows 15-20)"

for win in {15..20}; do
    agent_num=$((win-14))
    log_info "  Starting TeamA Agent $agent_num (Window $win)..."

    send_to_window $win "cd $PROJECT_ROOT"
    send_to_window $win "echo '🔴 TeamA Agent $agent_num: Starting Claude Code...'"
    send_to_window $win "claude exec --model sonnet --cd $PROJECT_ROOT 'Analyze project structure and provide development guidance' &"

    sleep 0.5
done

log_success "TeamA (6 agents) started"
sleep 2

# ============================================================
# TeamB: Coding Work (Windows 21-40, 20 agents)
# ============================================================
log_info "🟢 Starting TeamB: Coding Work (20 agents, Windows 21-40)"

for win in {21..40}; do
    agent_num=$((win-20))
    log_info "  Starting TeamB Agent $agent_num (Window $win)..."

    send_to_window $win "cd $PROJECT_ROOT"
    send_to_window $win "echo '🟢 TeamB Agent $agent_num: Starting Codex...'"
    send_to_window $win "codex exec --model sonnet --cd $PROJECT_ROOT 'Ready for implementation tasks' &"

    sleep 0.3
done

log_success "TeamB (20 agents) started"
sleep 2

# ============================================================
# TeamC: Review (Windows 41-60, 20 agents)
# ============================================================
log_info "🔵 Starting TeamC: Review (20 agents, Windows 41-60)"

for win in {41..60}; do
    agent_num=$((win-40))
    log_info "  Starting TeamC Agent $agent_num (Window $win)..."

    send_to_window $win "cd $PROJECT_ROOT"
    send_to_window $win "echo '🔵 TeamC Agent $agent_num: Starting Claude Code for Review...'"
    send_to_window $win "claude exec --model sonnet --cd $PROJECT_ROOT 'Ready for code review tasks' &"

    sleep 0.3
done

log_success "TeamC (20 agents) started"
sleep 2

# ============================================================
# TeamD: Business (Windows 61-80, 20 agents)
# ============================================================
log_info "🟡 Starting TeamD: Business (20 agents, Windows 61-80)"

for win in {61..80}; do
    agent_num=$((win-60))
    log_info "  Starting TeamD Agent $agent_num (Window $win)..."

    send_to_window $win "cd $PROJECT_ROOT"
    send_to_window $win "echo '🟡 TeamD Agent $agent_num: Starting Claude Code for Business Logic...'"
    send_to_window $win "claude exec --model sonnet --cd $PROJECT_ROOT 'Ready for business logic implementation' &"

    sleep 0.3
done

log_success "TeamD (20 agents) started"
sleep 2

# ============================================================
# TeamE: Analytics (Windows 81-100, 20 agents)
# ============================================================
log_info "🟣 Starting TeamE: Analytics (20 agents, Windows 81-100)"

for win in {81..100}; do
    agent_num=$((win-80))
    log_info "  Starting TeamE Agent $agent_num (Window $win)..."

    send_to_window $win "cd $PROJECT_ROOT"
    send_to_window $win "echo '🟣 TeamE Agent $agent_num: Starting Claude Code for Analytics...'"
    send_to_window $win "claude exec --model sonnet --cd $PROJECT_ROOT 'Ready for data analysis tasks' &"

    sleep 0.3
done

log_success "TeamE (20 agents) started"
sleep 2

echo ""
log_success "🚀 All 86 agents started!"
echo ""
echo -e "${CYAN}Agent Distribution:${NC}"
echo "  🔴 TeamA (Coding Lead): 6 agents  [Windows 15-20]"
echo "  🟢 TeamB (Coding Work): 20 agents [Windows 21-40]"
echo "  🔵 TeamC (Review):      20 agents [Windows 41-60]"
echo "  🟡 TeamD (Business):    20 agents [Windows 61-80]"
echo "  🟣 TeamE (Analytics):   20 agents [Windows 81-100]"
echo ""
echo -e "${YELLOW}Note:${NC} Agents are running in background. Use 'ps aux | grep claude' to verify."
echo ""
