#!/bin/bash
# =============================================================================
# Miyabi tmux Agent Control Script
# =============================================================================
#
# Purpose: Reliable control of Claude Code sub-agents in tmux sessions
#
# Features:
#   - Reliable command sending with Enter key separation
#   - Initialization completion verification
#   - Task execution verification
#   - Health check functionality
#   - Result collection
#
# Usage:
#   source scripts/tmux-agent-control.sh
#   tmux_send_command "miyabi-dev:1" "your command"
#   tmux_send_task "miyabi-dev:1" "your task"
#
# =============================================================================

# Configuration
TMUX_SESSION="miyabi-dev"
INIT_TIMEOUT=30
TASK_TIMEOUT=10
SLEEP_INTERVAL=0.5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# P0: Reliable Command Sending
# =============================================================================

# Send command to tmux window (without Enter)
tmux_send_text() {
    local target="$1"
    local text="$2"

    tmux send-keys -t "$target" "$text"
    sleep $SLEEP_INTERVAL
}

# Send Enter key to tmux window
tmux_send_enter() {
    local target="$1"

    tmux send-keys -t "$target" Enter
    sleep $SLEEP_INTERVAL
}

# Send command with reliable Enter (P0 improvement)
tmux_send_command() {
    local target="$1"
    local command="$2"

    echo -e "${BLUE}[SEND]${NC} $target: $command"

    # Step 1: Send command text
    tmux_send_text "$target" "$command"

    # Step 2: Send Enter separately
    tmux_send_enter "$target"

    echo -e "${GREEN}[OK]${NC} Command sent"
}

# =============================================================================
# P0: Initialization Completion Verification
# =============================================================================

# Wait for Claude Code to initialize
tmux_wait_for_init() {
    local target="$1"
    local timeout="${2:-$INIT_TIMEOUT}"
    local elapsed=0

    echo -e "${YELLOW}[WAIT]${NC} Waiting for Claude Code initialization in $target..."

    while [ $elapsed -lt $timeout ]; do
        # Check for Claude Code prompt indicator ">"
        if tmux capture-pane -t "$target" -p | grep -q "^>"; then
            echo -e "${GREEN}[OK]${NC} Claude Code initialized in $target (${elapsed}s)"
            return 0
        fi

        # Also check for "Claude Code" banner
        if tmux capture-pane -t "$target" -p | grep -q "Claude Code v"; then
            # Wait a bit more for full initialization
            sleep 2
            if tmux capture-pane -t "$target" -p | grep -q "^>"; then
                echo -e "${GREEN}[OK]${NC} Claude Code initialized in $target (${elapsed}s)"
                return 0
            fi
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    echo -e "${RED}[ERROR]${NC} Timeout waiting for initialization in $target"
    return 1
}

# =============================================================================
# P0: Task Execution Verification
# =============================================================================

# Verify task is executing
tmux_verify_execution() {
    local target="$1"
    local timeout="${2:-$TASK_TIMEOUT}"
    local elapsed=0

    echo -e "${YELLOW}[VERIFY]${NC} Checking task execution in $target..."

    while [ $elapsed -lt $timeout ]; do
        local output=$(tmux capture-pane -t "$target" -p)

        # Check for execution indicators
        if echo "$output" | grep -qE "⏺|✶|∴|Bash\(|Read\(|Grep\(|Write\("; then
            echo -e "${GREEN}[OK]${NC} Task is executing in $target"
            return 0
        fi

        # Check if already completed (waiting for next input)
        if echo "$output" | tail -5 | grep -q "^>$"; then
            # Check if there's output above the prompt
            local lines=$(echo "$output" | wc -l)
            if [ $lines -gt 10 ]; then
                echo -e "${GREEN}[OK]${NC} Task completed in $target"
                return 0
            fi
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    echo -e "${RED}[ERROR]${NC} Task may not have started in $target"
    return 1
}

# =============================================================================
# Complete Task Sending Workflow
# =============================================================================

# Send task with full verification (recommended)
tmux_send_task() {
    local target="$1"
    local task="$2"

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}[TASK]${NC} Sending to $target"
    echo -e "${BLUE}========================================${NC}"

    # Step 1: Send task text
    tmux_send_text "$target" "$task"

    # Step 2: Send Enter separately
    tmux_send_enter "$target"

    # Step 3: Verify execution
    if tmux_verify_execution "$target"; then
        echo -e "${GREEN}[SUCCESS]${NC} Task submitted and executing"
        return 0
    else
        echo -e "${YELLOW}[RETRY]${NC} Retrying Enter key..."
        tmux_send_enter "$target"
        sleep 2

        if tmux_verify_execution "$target" 5; then
            echo -e "${GREEN}[SUCCESS]${NC} Task started after retry"
            return 0
        else
            echo -e "${RED}[FAILED]${NC} Task may not have started"
            return 1
        fi
    fi
}

# =============================================================================
# P1: Health Check Functions
# =============================================================================

# Check health of single agent
tmux_check_agent_health() {
    local target="$1"
    local output=$(tmux capture-pane -t "$target" -p 2>/dev/null)

    if [ -z "$output" ]; then
        echo -e "${RED}[DOWN]${NC} $target - No output"
        return 1
    fi

    # Check for Claude Code indicators
    if echo "$output" | grep -qE "Claude Code|^>|⏺|✶"; then
        echo -e "${GREEN}[HEALTHY]${NC} $target"
        return 0
    else
        echo -e "${YELLOW}[UNKNOWN]${NC} $target - May need attention"
        return 2
    fi
}

# Check health of all agents in session
tmux_check_all_agents() {
    local session="${1:-$TMUX_SESSION}"

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}[HEALTH CHECK]${NC} Session: $session"
    echo -e "${BLUE}========================================${NC}"

    # Check if session exists
    if ! tmux has-session -t "$session" 2>/dev/null; then
        echo -e "${RED}[ERROR]${NC} Session $session not found"
        return 1
    fi

    # Get window count and iterate
    local window_count=$(tmux list-windows -t "$session" 2>/dev/null | wc -l)

    for i in $(seq 1 $window_count); do
        tmux_check_agent_health "$session:$i"
    done
}

# =============================================================================
# P1: Result Collection
# =============================================================================

# Collect results from single window
tmux_collect_result() {
    local target="$1"
    local output_file="${2:-/tmp/agent-result-$(date +%Y%m%d-%H%M%S).txt}"

    echo "=== $target ===" >> "$output_file"
    echo "Timestamp: $(date)" >> "$output_file"
    echo "---" >> "$output_file"
    tmux capture-pane -t "$target" -p >> "$output_file"
    echo "" >> "$output_file"

    echo -e "${GREEN}[SAVED]${NC} $target -> $output_file"
}

# Collect results from all agents
tmux_collect_all_results() {
    local session="${1:-$TMUX_SESSION}"
    local output_file="${2:-/tmp/miyabi-agents-$(date +%Y%m%d-%H%M%S).txt}"

    echo -e "${BLUE}[COLLECT]${NC} Gathering results from $session"

    # Check if session exists
    if ! tmux has-session -t "$session" 2>/dev/null; then
        echo -e "${RED}[ERROR]${NC} Session $session not found"
        return 1
    fi

    echo "Miyabi Agent Results" > "$output_file"
    echo "Session: $session" >> "$output_file"
    echo "Collected: $(date)" >> "$output_file"
    echo "========================================" >> "$output_file"
    echo "" >> "$output_file"

    # Get window list with names
    local window_count=$(tmux list-windows -t "$session" 2>/dev/null | wc -l)

    for i in $(seq 1 $window_count); do
        local window_name=$(tmux list-windows -t "$session" -F "#{window_index}:#{window_name}" 2>/dev/null | grep "^$i:" | cut -d: -f2)

        echo "=== Window $i: $window_name ===" >> "$output_file"
        tmux capture-pane -t "$session:$i" -p >> "$output_file"
        echo "" >> "$output_file"
    done

    echo -e "${GREEN}[SAVED]${NC} All results -> $output_file"
    echo "$output_file"
}

# =============================================================================
# P1: Error Detection
# =============================================================================

# Check for errors in window
tmux_check_errors() {
    local target="$1"
    local output=$(tmux capture-pane -t "$target" -p)

    if echo "$output" | grep -qiE "error|Error|ERROR|❌|failed|Failed|FAILED"; then
        echo -e "${RED}[ERROR DETECTED]${NC} $target"
        echo "$output" | grep -iE "error|Error|ERROR|❌|failed|Failed|FAILED" | tail -5
        return 1
    else
        echo -e "${GREEN}[NO ERRORS]${NC} $target"
        return 0
    fi
}

# =============================================================================
# Convenience Functions
# =============================================================================

# Start Claude Code agent in window
tmux_start_agent() {
    local target="$1"
    local system_prompt="$2"

    echo -e "${BLUE}[START]${NC} Starting agent in $target"

    # Send claude command with system prompt
    tmux_send_text "$target" "claude --system-prompt \"$system_prompt\""
    tmux_send_enter "$target"

    # Wait for initialization
    if tmux_wait_for_init "$target"; then
        echo -e "${GREEN}[READY]${NC} Agent ready in $target"
        return 0
    else
        return 1
    fi
}

# Kill agent in window
tmux_kill_agent() {
    local target="$1"

    echo -e "${YELLOW}[KILL]${NC} Stopping agent in $target"
    tmux send-keys -t "$target" C-c
    sleep 1
    tmux send-keys -t "$target" C-c
    sleep 0.5
    echo -e "${GREEN}[OK]${NC} Agent stopped"
}

# =============================================================================
# Session Management
# =============================================================================

# Create miyabi-dev session with standard windows
tmux_create_miyabi_session() {
    local session="${1:-$TMUX_SESSION}"

    echo -e "${BLUE}[CREATE]${NC} Creating session: $session"

    # Check if session exists
    if tmux has-session -t "$session" 2>/dev/null; then
        echo -e "${YELLOW}[EXISTS]${NC} Session $session already exists"
        return 1
    fi

    # Create session with windows
    tmux new-session -d -s "$session" -n "main"
    tmux new-window -t "$session" -n "code"
    tmux new-window -t "$session" -n "build"
    tmux new-window -t "$session" -n "logs"
    tmux new-window -t "$session" -n "git"

    echo -e "${GREEN}[OK]${NC} Session created with 5 windows"
}

# =============================================================================
# Main execution example
# =============================================================================

# Example usage function
tmux_agent_demo() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} Miyabi tmux Agent Control Demo${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Available functions:"
    echo "  tmux_send_command <target> <command>  - Send command reliably"
    echo "  tmux_send_task <target> <task>        - Send task with verification"
    echo "  tmux_wait_for_init <target>           - Wait for Claude Code init"
    echo "  tmux_verify_execution <target>        - Verify task is running"
    echo "  tmux_check_all_agents [session]       - Health check all agents"
    echo "  tmux_collect_all_results [session]    - Collect all results"
    echo "  tmux_start_agent <target> <prompt>    - Start agent with prompt"
    echo "  tmux_kill_agent <target>              - Stop agent"
    echo ""
    echo "Example:"
    echo "  tmux_send_task 'miyabi-dev:1' 'List all files'"
    echo ""
}

# Show help if sourced with --help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    tmux_agent_demo
fi
