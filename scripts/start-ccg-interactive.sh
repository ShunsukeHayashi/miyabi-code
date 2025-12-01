#!/bin/bash
# Start CCG Interactive Mode on MUGEN - 86 Claude Code Instances
# ============================================================

set -euo pipefail

SESSION="miyabi-ops"
PROJECT_ROOT="/home/ubuntu/miyabi-private"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

send_to_window() {
    local window=$1
    local command=$2
    tmux send-keys -t "${SESSION}:${window}" "$command" C-m
}

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   CCG Interactive - 86 Claude Code Instances             ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Starting CCG in interactive mode..."
echo ""

# TeamA (6 agents)
log_info "🔴 TeamA (6 agents, Windows 15-20)"
for win in {15..20}; do
    send_to_window $win "cd $PROJECT_ROOT && claude 'TeamA Agent $((win-14)): Ready for coding lead tasks'"
    sleep 0.5
done
log_success "TeamA started"

# TeamB (20 agents)
log_info "🟢 TeamB (20 agents, Windows 21-40)"
for win in {21..40}; do
    send_to_window $win "cd $PROJECT_ROOT && claude 'TeamB Agent $((win-20)): Ready for implementation'"
    sleep 0.3
done
log_success "TeamB started"

# TeamC (20 agents)
log_info "🔵 TeamC (20 agents, Windows 41-60)"
for win in {41..60}; do
    send_to_window $win "cd $PROJECT_ROOT && claude 'TeamC Agent $((win-40)): Ready for code review'"
    sleep 0.3
done
log_success "TeamC started"

# TeamD (20 agents)
log_info "🟡 TeamD (20 agents, Windows 61-80)"
for win in {61..80}; do
    send_to_window $win "cd $PROJECT_ROOT && claude 'TeamD Agent $((win-60)): Ready for business logic'"
    sleep 0.3
done
log_success "TeamD started"

# TeamE (20 agents)
log_info "🟣 TeamE (20 agents, Windows 81-100)"
for win in {81..100}; do
    send_to_window $win "cd $PROJECT_ROOT && claude 'TeamE Agent $((win-80)): Ready for analytics'"
    sleep 0.3
done
log_success "TeamE started"

echo ""
log_success "🚀 All 86 CCG agents started!"
echo -e "${YELLOW}Verify:${NC} ps aux | grep claude | wc -l"
