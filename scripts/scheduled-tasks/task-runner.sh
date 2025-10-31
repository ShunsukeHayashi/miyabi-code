#!/usr/bin/env bash
#
# Miyabi Scheduled Task Runner
# Version: 1.0.0
# Purpose: Execute scheduled tasks with Claude Code headless mode integration
#
# Usage:
#   ./task-runner.sh <task-id>
#   ./task-runner.sh --list
#   ./task-runner.sh --dry-run <task-id>
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASKS_FILE="${TASKS_FILE:-$SCRIPT_DIR/tasks.yaml}"
LOG_DIR="${PROJECT_ROOT}/.ai/logs/scheduled-tasks"
HISTORY_FILE="${LOG_DIR}/history.json"
CLAUDE_CODE_BIN="${CLAUDE_CODE_BIN:-claude}"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# ========================================
# Utility Functions
# ========================================

log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO]${NC} [$timestamp] $*" >&2
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS]${NC} [$timestamp] $*" >&2
}

log_warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARN]${NC} [$timestamp] $*" >&2
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} [$timestamp] $*" >&2
}

# Check dependencies
check_dependencies() {
    local missing_deps=()

    # Check yq
    if ! command -v yq &> /dev/null; then
        missing_deps+=("yq")
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    # Check claude
    if ! command -v "$CLAUDE_CODE_BIN" &> /dev/null; then
        log_warn "Claude Code CLI not found at: $CLAUDE_CODE_BIN"
        log_warn "Claude Code tasks will fail. Install from: https://claude.ai/download"
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Install with: brew install ${missing_deps[*]}"
        exit 1
    fi
}

# Initialize log directory and history
init_logging() {
    mkdir -p "$LOG_DIR"

    # Initialize history file if not exists
    if [ ! -f "$HISTORY_FILE" ]; then
        echo '{"executions": []}' > "$HISTORY_FILE"
    fi
}

# Send macOS notification
send_notification() {
    local title="$1"
    local message="$2"
    local sound="${3:-Glass}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "display notification \"$message\" with title \"$title\" sound name \"$sound\"" 2>/dev/null || true
    fi
}

# Send VOICEVOX notification (if enabled)
send_voicevox_notification() {
    local message="$1"
    local voicevox_enabled=$(yq '.config.voicevox_enabled // false' "$TASKS_FILE")

    if [ "$voicevox_enabled" == "true" ]; then
        if [ -x "$PROJECT_ROOT/crates/miyabi-voice-guide/scripts/speak.sh" ]; then
            "$PROJECT_ROOT/crates/miyabi-voice-guide/scripts/speak.sh" "$message" 2>/dev/null || true
        fi
    fi
}

# ========================================
# Task Functions
# ========================================

# Get task configuration
get_task_config() {
    local task_id="$1"
    local field="$2"

    yq ".tasks[] | select(.id == \"$task_id\") | .$field" "$TASKS_FILE"
}

# Check if task is enabled
is_task_enabled() {
    local task_id="$1"
    local enabled=$(get_task_config "$task_id" "enabled")

    [ "$enabled" == "true" ]
}

# List all tasks
list_tasks() {
    log_info "Available scheduled tasks:"
    echo ""

    printf "%-30s %-15s %-15s %s\n" "TASK ID" "SCHEDULE" "STATUS" "DESCRIPTION"
    printf "%-30s %-15s %-15s %s\n" "-------" "--------" "------" "-----------"

    local task_count=0
    while true; do
        local id=$(yq ".tasks[$task_count].id" "$TASKS_FILE" 2>/dev/null)

        # Break if no more tasks
        if [ "$id" == "null" ] || [ -z "$id" ]; then
            break
        fi

        local schedule=$(yq ".tasks[$task_count].schedule" "$TASKS_FILE")
        local enabled=$(yq ".tasks[$task_count].enabled" "$TASKS_FILE")
        local description=$(yq ".tasks[$task_count].description" "$TASKS_FILE")

        local status="❌ Disabled"
        if [ "$enabled" == "true" ]; then
            status="✅ Enabled"
        fi

        printf "%-30s %-15s %-15s %s\n" "$id" "$schedule" "$status" "$description"

        task_count=$((task_count + 1))
    done

    echo ""
    log_info "Total tasks: $(yq '.tasks | length' "$TASKS_FILE")"
    log_info "Enabled tasks: $(yq '.tasks[] | select(.enabled == true) | .id' "$TASKS_FILE" | wc -l | xargs)"
}

# Execute task with Claude Code headless mode
execute_with_claude() {
    local task_id="$1"
    local command="$2"
    local tools="$3"
    local timeout="$4"
    local log_file="$5"

    log_info "Executing with Claude Code headless mode..."

    # Build Claude Code command
    local claude_cmd="$CLAUDE_CODE_BIN -p \"$command\""

    # Add timeout if specified
    if [ "$timeout" -gt 0 ]; then
        claude_cmd="timeout ${timeout}s $claude_cmd"
    fi

    # Execute
    eval "$claude_cmd" 2>&1 | tee -a "$log_file"
    return ${PIPESTATUS[0]}
}

# Execute task directly (without Claude Code)
execute_direct() {
    local task_id="$1"
    local command="$2"
    local timeout="$4"
    local log_file="$5"

    log_info "Executing command directly..."

    # Change to project root
    cd "$PROJECT_ROOT"

    # Build command with timeout
    local cmd="$command"
    if [ "$timeout" -gt 0 ]; then
        cmd="timeout ${timeout}s $cmd"
    fi

    # Execute
    eval "$cmd" 2>&1 | tee -a "$log_file"
    return ${PIPESTATUS[0]}
}

# Execute a single task
execute_task() {
    local task_id="$1"
    local dry_run="${2:-false}"

    log_info "=========================================="
    log_info "Task: $task_id"
    log_info "=========================================="

    # Check if task exists
    if ! yq ".tasks[] | select(.id == \"$task_id\")" "$TASKS_FILE" | grep -q .; then
        log_error "Task not found: $task_id"
        return 1
    fi

    # Check if task is enabled
    if ! is_task_enabled "$task_id"; then
        log_warn "Task is disabled: $task_id"
        return 1
    fi

    # Get task configuration
    local task_name=$(get_task_config "$task_id" "name")
    local task_command=$(get_task_config "$task_id" "command")
    local task_tools=$(get_task_config "$task_id" "tools" | tr -d '"')
    local task_timeout=$(get_task_config "$task_id" "timeout")
    local task_description=$(get_task_config "$task_id" "description")

    log_info "Name: $task_name"
    log_info "Description: $task_description"
    log_info "Command: $task_command"
    log_info "Timeout: ${task_timeout}s"

    if [ -n "$task_tools" ]; then
        log_info "Tools: $task_tools"
    fi

    # Dry run mode
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would execute task: $task_id"
        return 0
    fi

    # Create log file
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    local log_file="$LOG_DIR/${task_id}-${timestamp}.log"

    log_info "Log file: $log_file"

    # Record start time
    local start_time=$(date +%s)
    local start_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Execute task
    local exit_code=0
    if [ -n "$task_tools" ]; then
        # Use Claude Code for tasks with tools
        execute_with_claude "$task_id" "$task_command" "$task_tools" "$task_timeout" "$log_file" || exit_code=$?
    else
        # Direct execution for simple tasks
        execute_direct "$task_id" "$task_command" "" "$task_timeout" "$log_file" || exit_code=$?
    fi

    # Record end time
    local end_time=$(date +%s)
    local end_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local duration=$((end_time - start_time))

    # Determine status
    local status="success"
    if [ $exit_code -ne 0 ]; then
        status="failed"
    fi

    # Log result
    if [ "$status" == "success" ]; then
        log_success "Task completed successfully in ${duration}s"
        send_notification "Miyabi Scheduled Task" "Task '$task_name' completed successfully"
    else
        log_error "Task failed with exit code $exit_code after ${duration}s"
        send_notification "Miyabi Scheduled Task" "Task '$task_name' failed" "Basso"
        send_voicevox_notification "スケジュールされたタスク ${task_name} が失敗しました"
    fi

    # Update history
    update_history "$task_id" "$status" "$start_iso" "$end_iso" "$duration" "$exit_code" "$log_file"

    return $exit_code
}

# Update execution history
update_history() {
    local task_id="$1"
    local status="$2"
    local start_time="$3"
    local end_time="$4"
    local duration="$5"
    local exit_code="$6"
    local log_file="$7"

    local temp_file=$(mktemp)

    jq --arg task_id "$task_id" \
       --arg status "$status" \
       --arg start_time "$start_time" \
       --arg end_time "$end_time" \
       --argjson duration "$duration" \
       --argjson exit_code "$exit_code" \
       --arg log_file "$log_file" \
       '.executions += [{
           task_id: $task_id,
           status: $status,
           start_time: $start_time,
           end_time: $end_time,
           duration_seconds: $duration,
           exit_code: $exit_code,
           log_file: $log_file
       }]' "$HISTORY_FILE" > "$temp_file"

    mv "$temp_file" "$HISTORY_FILE"
}

# ========================================
# Main
# ========================================

show_help() {
    cat <<EOF
Miyabi Scheduled Task Runner

Usage:
  $(basename "$0") <task-id>              Execute a task
  $(basename "$0") --list                 List all tasks
  $(basename "$0") --dry-run <task-id>    Dry run (show what would be executed)
  $(basename "$0") --history [task-id]    Show execution history
  $(basename "$0") --help                 Show this help

Examples:
  $(basename "$0") ai-blog-daily
  $(basename "$0") --list
  $(basename "$0") --dry-run worktree-cleanup
  $(basename "$0") --history ai-blog-daily

Environment Variables:
  TASKS_FILE         Path to tasks.yaml (default: ./tasks.yaml)
  CLAUDE_CODE_BIN    Path to claude binary (default: claude)

Files:
  Tasks config:  $TASKS_FILE
  Log directory: $LOG_DIR
  History file:  $HISTORY_FILE
EOF
}

show_history() {
    local task_id="${1:-}"

    if [ -n "$task_id" ]; then
        log_info "Execution history for task: $task_id"
        jq -r ".executions[] | select(.task_id == \"$task_id\") |
               \"[\(.start_time)] \(.status) (\(.duration_seconds)s) - Exit code: \(.exit_code)\"" \
               "$HISTORY_FILE" | tail -20
    else
        log_info "Recent execution history (last 20):"
        jq -r '.executions[] |
               "[\(.start_time)] \(.task_id): \(.status) (\(.duration_seconds)s)"' \
               "$HISTORY_FILE" | tail -20
    fi

    echo ""
    local total_executions=$(jq '.executions | length' "$HISTORY_FILE")
    local success_count=$(jq '.executions[] | select(.status == "success") | .task_id' "$HISTORY_FILE" | wc -l | xargs)
    local failure_count=$(jq '.executions[] | select(.status == "failed") | .task_id' "$HISTORY_FILE" | wc -l | xargs)

    log_info "Total executions: $total_executions"
    log_success "Successes: $success_count"
    log_error "Failures: $failure_count"
}

main() {
    # Check dependencies
    check_dependencies

    # Initialize logging
    init_logging

    # Parse arguments
    case "${1:-}" in
        --list|-l)
            list_tasks
            ;;
        --dry-run|-d)
            if [ -z "${2:-}" ]; then
                log_error "Task ID required for dry run"
                show_help
                exit 1
            fi
            execute_task "$2" true
            ;;
        --history|-h)
            show_history "${2:-}"
            ;;
        --help|help)
            show_help
            ;;
        "")
            log_error "No task ID specified"
            show_help
            exit 1
            ;;
        *)
            execute_task "$1"
            ;;
    esac
}

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
