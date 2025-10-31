#!/bin/bash
# Codex Task Runner with Monitoring
# Usage: ./scripts/codex-task-runner.sh {start|status|monitor|logs|results|wait|stop}

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TASKS_DIR="$PROJECT_ROOT/.ai/codex-tasks"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging
log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*" >&2; }

# Initialize task directory
init_task() {
    local task_id="$1"
    local task_dir="$TASKS_DIR/$task_id"

    mkdir -p "$task_dir/artifacts/pr-reviews"
    mkdir -p "$task_dir/artifacts/reports"

    cat > "$task_dir/status.json" <<EOF
{
  "task_id": "$task_id",
  "type": "unknown",
  "status": "initializing",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "progress": {
    "total": 0,
    "completed": 0,
    "percentage": 0.0
  },
  "results": {},
  "pid": null,
  "log_file": "$task_dir/progress.log"
}
EOF

    echo "$task_dir"
}

# Update task status
update_status() {
    local task_id="$1"
    local status="$2"
    local task_dir="$TASKS_DIR/$task_id"

    if [[ ! -f "$task_dir/status.json" ]]; then
        log_error "Task $task_id not found"
        return 1
    fi

    # Update status using jq
    tmp=$(mktemp)
    jq --arg status "$status" --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '.status = $status | .updated_at = $updated' \
        "$task_dir/status.json" > "$tmp"
    mv "$tmp" "$task_dir/status.json"
}

# Start a new Codex task
cmd_start() {
    local task_id=""
    local instructions_file=""
    local task_type="generic"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --task-id)
                task_id="$2"
                shift 2
                ;;
            --instructions)
                instructions_file="$2"
                shift 2
                ;;
            --type)
                task_type="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    if [[ -z "$task_id" ]]; then
        task_id="codex-task-$(date +%Y%m%d-%H%M%S)"
    fi

    log_info "Initializing Codex task: $task_id"
    local task_dir=$(init_task "$task_id")

    # Copy instructions
    if [[ -n "$instructions_file" && -f "$instructions_file" ]]; then
        cp "$instructions_file" "$task_dir/instructions.md"
    fi

    # Update task metadata
    tmp=$(mktemp)
    jq --arg type "$task_type" '.type = $type' "$task_dir/status.json" > "$tmp"
    mv "$tmp" "$task_dir/status.json"

    log_success "Task initialized: $task_dir"
    log_info "Task ID: $task_id"
    log_info "Next steps:"
    echo "  1. Execute Codex with instructions from: $task_dir/instructions.md"
    echo "  2. Monitor progress: ./scripts/codex-task-runner.sh monitor $task_id"
    echo "  3. View logs: ./scripts/codex-task-runner.sh logs $task_id --follow"

    # Update to running status
    update_status "$task_id" "ready"

    echo "$task_id"
}

# Get task status
cmd_status() {
    local task_id="$1"
    local task_dir="$TASKS_DIR/$task_id"

    if [[ ! -f "$task_dir/status.json" ]]; then
        log_error "Task $task_id not found"
        return 1
    fi

    cat "$task_dir/status.json" | jq -r '
        "Task ID: \(.task_id)",
        "Type: \(.type)",
        "Status: \(.status)",
        "Created: \(.created_at)",
        "Updated: \(.updated_at)",
        "",
        "Progress:",
        "  Total: \(.progress.total)",
        "  Completed: \(.progress.completed)",
        "  Percentage: \(.progress.percentage)%"
    '
}

# Monitor task in real-time
cmd_monitor() {
    local task_id="$1"
    local task_dir="$TASKS_DIR/$task_id"

    if [[ ! -d "$task_dir" ]]; then
        log_error "Task $task_id not found"
        return 1
    fi

    log_info "Monitoring task: $task_id"
    log_info "Press Ctrl+C to stop monitoring"
    echo ""

    while true; do
        clear
        echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║${NC} Codex Task Monitor - $task_id"
        echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"

        if [[ -f "$task_dir/status.json" ]]; then
            cat "$task_dir/status.json" | jq -r '
                "Status: \(.status)",
                "Created: \(.created_at)",
                "Updated: \(.updated_at)",
                "",
                "Progress: \(.progress.completed)/\(.progress.total) (\(.progress.percentage)%)"
            '
        fi

        echo ""
        echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${CYAN}║${NC} Recent Logs:"

        if [[ -f "$task_dir/progress.log" ]]; then
            tail -10 "$task_dir/progress.log" | sed 's/^/  /'
        else
            echo "  No logs available yet"
        fi

        echo ""
        echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${CYAN}║${NC} Refreshing in 5 seconds... (Ctrl+C to stop)"
        echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"

        sleep 5
    done
}

# View task logs
cmd_logs() {
    local task_id="$1"
    local follow=false

    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --follow|-f)
                follow=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    local task_dir="$TASKS_DIR/$task_id"
    local log_file="$task_dir/progress.log"

    if [[ ! -f "$log_file" ]]; then
        log_error "Log file not found for task $task_id"
        return 1
    fi

    if [[ "$follow" == true ]]; then
        tail -f "$log_file"
    else
        cat "$log_file"
    fi
}

# Get task results
cmd_results() {
    local task_id="$1"
    local task_dir="$TASKS_DIR/$task_id"

    if [[ ! -f "$task_dir/results.json" ]]; then
        log_warn "Results not available yet for task $task_id"
        log_info "Current status:"
        cmd_status "$task_id"
        return 1
    fi

    cat "$task_dir/results.json"
}

# Wait for task completion
cmd_wait() {
    local task_id="$1"
    local task_dir="$TASKS_DIR/$task_id"

    log_info "Waiting for task completion: $task_id"

    while true; do
        if [[ ! -f "$task_dir/status.json" ]]; then
            log_error "Task $task_id not found"
            return 1
        fi

        local status=$(jq -r '.status' "$task_dir/status.json")

        if [[ "$status" == "completed" ]]; then
            log_success "Task completed successfully"
            return 0
        elif [[ "$status" == "failed" ]]; then
            log_error "Task failed"
            return 1
        fi

        sleep 10
    done
}

# Generate report
cmd_report() {
    local task_id="$1"
    local format="markdown"

    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --format)
                format="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    local task_dir="$TASKS_DIR/$task_id"

    if [[ "$format" == "markdown" ]]; then
        cat > "$task_dir/artifacts/reports/summary.md" <<EOF
# Codex Task Report: $task_id

**Generated**: $(date)

## Task Information
EOF

        jq -r '
            "**Type**: \(.type)",
            "**Status**: \(.status)",
            "**Created**: \(.created_at)",
            "**Updated**: \(.updated_at)",
            "",
            "## Progress",
            "- Total: \(.progress.total)",
            "- Completed: \(.progress.completed)",
            "- Percentage: \(.progress.percentage)%"
        ' "$task_dir/status.json" >> "$task_dir/artifacts/reports/summary.md"

        cat "$task_dir/artifacts/reports/summary.md"
    else
        jq '.' "$task_dir/status.json"
    fi
}

# Main command dispatcher
main() {
    if [[ $# -lt 1 ]]; then
        echo "Usage: $0 {start|status|monitor|logs|results|wait|report|stop}"
        echo ""
        echo "Commands:"
        echo "  start      - Start a new Codex task"
        echo "  status     - Get task status"
        echo "  monitor    - Monitor task in real-time (TUI)"
        echo "  logs       - View task logs"
        echo "  results    - Get task results"
        echo "  wait       - Wait for task completion"
        echo "  report     - Generate task report"
        exit 1
    fi

    local cmd="$1"
    shift

    case "$cmd" in
        start)
            cmd_start "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        monitor)
            cmd_monitor "$@"
            ;;
        logs)
            cmd_logs "$@"
            ;;
        results)
            cmd_results "$@"
            ;;
        wait)
            cmd_wait "$@"
            ;;
        report)
            cmd_report "$@"
            ;;
        *)
            log_error "Unknown command: $cmd"
            exit 1
            ;;
    esac
}

main "$@"
