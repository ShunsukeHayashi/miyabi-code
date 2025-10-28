#!/usr/bin/env bash
#
# Claude Code X - Autonomous Claude Code Executor
# Version: 1.0.0
# Purpose: Run Claude Code autonomously in background (like Codex X)
#
# Usage:
#   /claude-code-x exec "Task description"
#   /claude-code-x sessions
#   /claude-code-x status <session-id>
#   /claude-code-x result <session-id>
#   /claude-code-x kill <session-id>
#

set -euo pipefail

# Configuration
SESSION_DIR="${CLAUDE_CODE_X_SESSION_DIR:-.ai/sessions/claude-code-x}"
LOG_DIR="${CLAUDE_CODE_X_LOG_DIR:-$SESSION_DIR/logs}"
MAX_SESSIONS="${CLAUDE_CODE_X_MAX_SESSIONS:-5}"
TIMEOUT="${CLAUDE_CODE_X_TIMEOUT:-600}"  # 10 minutes default
DEFAULT_TOOLS="Bash,Read,Write,Edit,Glob,Grep"
PERMISSION_MODE="acceptEdits"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$SESSION_DIR" "$LOG_DIR"

# Generate session ID
generate_session_id() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local random=$(openssl rand -hex 3 2>/dev/null || echo $(( RANDOM % 999999 )))
    echo "claude-code-x-${timestamp}-${random}"
}

# Register session
register_session() {
    local session_id="$1"
    local task="$2"
    local pid="$3"
    local log_file="$4"

    local session_file="${SESSION_DIR}/${session_id}.json"

    # Escape special characters for JSON
    local escaped_task=$(echo "$task" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed 's/!/\\!/g')

    cat > "$session_file" <<EOF
{
  "session_id": "$session_id",
  "task": "$escaped_task",
  "pid": $pid,
  "status": "running",
  "log_file": "$log_file",
  "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tool": "claude-code-x"
}
EOF

    echo "$session_file"
}

# Update session status
update_session_status() {
    local session_id="$1"
    local status="$2"
    local session_file="${SESSION_DIR}/${session_id}.json"

    if [ ! -f "$session_file" ]; then
        return 1
    fi

    # Use jq if available, otherwise sed
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq ".status = \"$status\" | .ended_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$session_file" > "$temp_file"
        mv "$temp_file" "$session_file"
    else
        sed -i '' "s/\"status\": \"[^\"]*\"/\"status\": \"$status\"/" "$session_file"
    fi
}

# Execute command
cmd_exec() {
    local task="$1"
    shift

    local tools="$DEFAULT_TOOLS"
    local timeout="$TIMEOUT"

    # Parse optional arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tools)
                tools="$2"
                shift 2
                ;;
            --timeout)
                timeout="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done

    # Check session limit
    local active_count=$(ls -1 "$SESSION_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
    if [ "$active_count" -ge "$MAX_SESSIONS" ]; then
        echo -e "${RED}❌ Maximum concurrent sessions ($MAX_SESSIONS) reached${NC}"
        echo -e "${YELLOW}💡 Kill inactive sessions with: /claude-code-x kill <session-id>${NC}"
        exit 1
    fi

    # Generate session ID
    local session_id=$(generate_session_id)
    local log_file="${LOG_DIR}/${session_id}.log"

    echo -e "${BLUE}🚀 Starting Claude Code X session: ${session_id}${NC}"
    echo -e "${BLUE}📝 Log file: ${log_file}${NC}"
    echo ""

    # Start Claude Code in background
    (
        {
            echo "=== Claude Code X Session Log ==="
            echo "Session ID: $session_id"
            echo "Started at: $(date)"
            echo "Task: $task"
            echo "Tools: $tools"
            echo "Timeout: ${timeout}s"
            echo "================================="
            echo ""

            # Execute claude -p
            timeout "${timeout}s" claude -p "$task" \
                --allowedTools "$tools" \
                --permission-mode "$PERMISSION_MODE" 2>&1

            local exit_code=$?

            echo ""
            echo "================================="
            echo "Session ended at: $(date)"
            echo "Exit code: $exit_code"

            # Update session status
            if [ $exit_code -eq 0 ]; then
                update_session_status "$session_id" "completed"
                echo "Status: completed ✅"
            elif [ $exit_code -eq 124 ]; then
                update_session_status "$session_id" "timeout"
                echo "Status: timeout ⏱️"
            else
                update_session_status "$session_id" "failed"
                echo "Status: failed ❌"
            fi
        } > "$log_file" 2>&1
    ) &

    local pid=$!

    # Register session
    register_session "$session_id" "$task" "$pid" "$log_file" > /dev/null

    echo -e "${GREEN}✅ Session started successfully${NC}"
    echo -e "${GREEN}🔗 Session ID: ${session_id}${NC}"
    echo -e "${GREEN}🔗 PID: ${pid}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Monitor progress:${NC}"
    echo -e "   ${BLUE}/claude-code-x status $session_id${NC}"
    echo -e "   ${BLUE}tail -f $log_file${NC}"
}

# List sessions
cmd_sessions() {
    echo -e "${BLUE}📋 Active Claude Code X sessions:${NC}"
    echo ""

    local found=false
    for session_file in "$SESSION_DIR"/*.json; do
        if [ ! -f "$session_file" ]; then
            continue
        fi

        found=true

        # Extract session info
        if command -v jq &> /dev/null; then
            local session_id=$(jq -r '.session_id' "$session_file")
            local pid=$(jq -r '.pid' "$session_file")
            local status=$(jq -r '.status' "$session_file")
            local task=$(jq -r '.task' "$session_file" | head -c 50)
        else
            local session_id=$(basename "$session_file" .json)
            local pid=$(grep -o '"pid": [0-9]*' "$session_file" | awk '{print $2}')
            local status=$(grep -o '"status": "[^"]*"' "$session_file" | cut -d'"' -f4)
            local task="<task>"
        fi

        # Check if process is still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "  ${GREEN}✅ $session_id${NC} (PID: $pid) - ${YELLOW}Running${NC}"
        else
            if [ "$status" = "completed" ]; then
                echo -e "  ${GREEN}✅ $session_id${NC} (PID: $pid) - ${GREEN}Completed${NC}"
            elif [ "$status" = "timeout" ]; then
                echo -e "  ${YELLOW}⏱️  $session_id${NC} (PID: $pid) - ${YELLOW}Timeout${NC}"
            elif [ "$status" = "failed" ]; then
                echo -e "  ${RED}❌ $session_id${NC} (PID: $pid) - ${RED}Failed${NC}"
            else
                echo -e "  ${RED}❌ $session_id${NC} (PID: $pid) - ${RED}Stopped${NC}"
            fi
        fi

        echo -e "     Task: ${task}..."
        echo ""
    done

    if [ "$found" = false ]; then
        echo -e "${YELLOW}  No active sessions found${NC}"
        echo ""
        echo -e "${YELLOW}💡 Start a new session with: /claude-code-x exec \"Task description\"${NC}"
    fi
}

# Get session status
cmd_status() {
    local session_id="$1"
    local log_file="${LOG_DIR}/${session_id}.log"

    if [ ! -f "$log_file" ]; then
        echo -e "${RED}❌ Session not found: $session_id${NC}"
        exit 1
    fi

    echo -e "${BLUE}📊 Status for ${session_id}:${NC}"
    echo ""
    echo -e "${BLUE}Last 20 lines of output:${NC}"
    echo "================================="
    tail -20 "$log_file"
    echo "================================="
    echo ""
    echo -e "${YELLOW}💡 Full output: /claude-code-x result $session_id${NC}"
    echo -e "${YELLOW}💡 Live monitoring: tail -f $log_file${NC}"
}

# Get session result
cmd_result() {
    local session_id="$1"
    local log_file="${LOG_DIR}/${session_id}.log"

    if [ ! -f "$log_file" ]; then
        echo -e "${RED}❌ Session not found: $session_id${NC}"
        exit 1
    fi

    echo -e "${BLUE}📄 Full output for ${session_id}:${NC}"
    echo "================================="
    cat "$log_file"
    echo "================================="
}

# Kill session
cmd_kill() {
    local session_id="$1"
    local session_file="${SESSION_DIR}/${session_id}.json"

    if [ ! -f "$session_file" ]; then
        echo -e "${RED}❌ Session not found: $session_id${NC}"
        exit 1
    fi

    # Extract PID
    if command -v jq &> /dev/null; then
        local pid=$(jq -r '.pid' "$session_file")
    else
        local pid=$(grep -o '"pid": [0-9]*' "$session_file" | awk '{print $2}')
    fi

    # Kill process
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
        echo -e "${GREEN}🛑 Killed session ${session_id} (PID: ${pid})${NC}"
        update_session_status "$session_id" "killed"
    else
        echo -e "${YELLOW}⚠️  Process already stopped (PID: ${pid})${NC}"
    fi
}

# Cleanup old sessions
cmd_cleanup() {
    echo -e "${BLUE}🧹 Cleaning up old sessions...${NC}"

    local cleaned=0
    for session_file in "$SESSION_DIR"/*.json; do
        if [ ! -f "$session_file" ]; then
            continue
        fi

        # Extract PID
        if command -v jq &> /dev/null; then
            local pid=$(jq -r '.pid' "$session_file")
            local status=$(jq -r '.status' "$session_file")
        else
            local pid=$(grep -o '"pid": [0-9]*' "$session_file" | awk '{print $2}')
            local status=$(grep -o '"status": "[^"]*"' "$session_file" | cut -d'"' -f4)
        fi

        # Clean if process is not running and status is not running
        if ! kill -0 "$pid" 2>/dev/null && [ "$status" != "running" ]; then
            local session_id=$(basename "$session_file" .json)
            rm -f "$session_file"
            ((cleaned++))
            echo -e "  ${GREEN}✓ Cleaned: $session_id${NC}"
        fi
    done

    echo ""
    echo -e "${GREEN}✅ Cleaned up $cleaned sessions${NC}"
}

# Main command dispatcher
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
    exec)
        if [ -z "${1:-}" ]; then
            echo -e "${RED}❌ Error: Task description required${NC}"
            echo -e "${YELLOW}Usage: /claude-code-x exec \"Task description\" [--tools \"Tool1,Tool2\"] [--timeout 600]${NC}"
            exit 1
        fi
        cmd_exec "$@"
        ;;
    sessions|list)
        cmd_sessions
        ;;
    status)
        if [ -z "${1:-}" ]; then
            echo -e "${RED}❌ Error: Session ID required${NC}"
            echo -e "${YELLOW}Usage: /claude-code-x status <session-id>${NC}"
            exit 1
        fi
        cmd_status "$1"
        ;;
    result|output)
        if [ -z "${1:-}" ]; then
            echo -e "${RED}❌ Error: Session ID required${NC}"
            echo -e "${YELLOW}Usage: /claude-code-x result <session-id>${NC}"
            exit 1
        fi
        cmd_result "$1"
        ;;
    kill|stop)
        if [ -z "${1:-}" ]; then
            echo -e "${RED}❌ Error: Session ID required${NC}"
            echo -e "${YELLOW}Usage: /claude-code-x kill <session-id>${NC}"
            exit 1
        fi
        cmd_kill "$1"
        ;;
    cleanup|clean)
        cmd_cleanup
        ;;
    *)
        echo -e "${BLUE}Claude Code X - Autonomous Claude Code Executor${NC}"
        echo ""
        echo -e "${YELLOW}Usage:${NC}"
        echo -e "  ${BLUE}/claude-code-x exec \"Task description\"${NC}     - Execute task in background"
        echo -e "  ${BLUE}/claude-code-x sessions${NC}                     - List all sessions"
        echo -e "  ${BLUE}/claude-code-x status <session-id>${NC}          - Check session status"
        echo -e "  ${BLUE}/claude-code-x result <session-id>${NC}          - Get full session output"
        echo -e "  ${BLUE}/claude-code-x kill <session-id>${NC}            - Kill a session"
        echo -e "  ${BLUE}/claude-code-x cleanup${NC}                      - Clean up old sessions"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo -e "  ${BLUE}/claude-code-x exec \"Implement user authentication\"${NC}"
        echo -e "  ${BLUE}/claude-code-x exec \"Fix bug in login.rs\" --timeout 300${NC}"
        echo -e "  ${BLUE}/claude-code-x sessions${NC}"
        echo -e "  ${BLUE}/claude-code-x status claude-code-x-20251027-123456-abc123${NC}"
        exit 1
        ;;
esac
