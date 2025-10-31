#!/usr/bin/env bash
#
# Miyabi Scheduled Task Monitor
# Version: 1.0.0
# Purpose: Monitor scheduled task executions and display dashboard
#
# Usage:
#   ./monitor.sh                 Show execution dashboard
#   ./monitor.sh --watch         Watch mode (auto-refresh)
#   ./monitor.sh --task <id>     Show task-specific metrics
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

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# ========================================
# Dashboard Functions
# ========================================

format_duration() {
    local seconds=$1

    if [ $seconds -lt 60 ]; then
        echo "${seconds}s"
    elif [ $seconds -lt 3600 ]; then
        printf "%dm %ds" $((seconds / 60)) $((seconds % 60))
    else
        printf "%dh %dm" $((seconds / 3600)) $(((seconds % 3600) / 60))
    fi
}

show_dashboard() {
    clear

    echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║  📊 Miyabi Scheduled Tasks - Execution Dashboard                  ║${NC}"
    echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Overall Statistics
    echo -e "${BOLD}${CYAN}Overall Statistics${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"

    if [ ! -f "$HISTORY_FILE" ]; then
        echo -e "${YELLOW}No execution history found${NC}"
        return
    fi

    local total_executions=$(jq '.executions | length' "$HISTORY_FILE")
    local success_count=$(jq '[.executions[] | select(.status == "success")] | length' "$HISTORY_FILE")
    local failure_count=$(jq '[.executions[] | select(.status == "failed")] | length' "$HISTORY_FILE")
    local success_rate=0

    if [ $total_executions -gt 0 ]; then
        success_rate=$(awk "BEGIN {printf \"%.1f\", ($success_count / $total_executions) * 100}")
    fi

    echo -e "  Total Executions:    ${BOLD}$total_executions${NC}"
    echo -e "  ${GREEN}✓${NC} Successes:         ${GREEN}$success_count${NC}"
    echo -e "  ${RED}✗${NC} Failures:          ${RED}$failure_count${NC}"
    echo -e "  Success Rate:        ${BOLD}${success_rate}%${NC}"
    echo ""

    # Recent Executions
    echo -e "${BOLD}${CYAN}Recent Executions (Last 10)${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
    printf "%-20s %-30s %-10s %-10s\n" "TIMESTAMP" "TASK" "STATUS" "DURATION"
    printf "%-20s %-30s %-10s %-10s\n" "──────────" "────" "──────" "────────"

    jq -r '.executions[-10:] | reverse[] |
           "\(.start_time | split("T")[0] + " " + (split("T")[1] | split("Z")[0]))|\(.task_id)|\(.status)|\(.duration_seconds)"' \
           "$HISTORY_FILE" | \
    while IFS='|' read -r timestamp task_id status duration; do
        local status_icon="❓"
        local status_color="$NC"

        if [ "$status" == "success" ]; then
            status_icon="✅"
            status_color="$GREEN"
        elif [ "$status" == "failed" ]; then
            status_icon="❌"
            status_color="$RED"
        fi

        local duration_formatted=$(format_duration "$duration")

        printf "%-20s %-30s ${status_color}%-10s${NC} %-10s\n" \
               "$timestamp" "$task_id" "$status_icon $status" "$duration_formatted"
    done

    echo ""

    # Task-Specific Statistics
    echo -e "${BOLD}${CYAN}Task Statistics${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
    printf "%-30s %-10s %-10s %-10s %-15s\n" "TASK" "RUNS" "SUCCESS" "FAILED" "AVG DURATION"
    printf "%-30s %-10s %-10s %-10s %-15s\n" "────" "────" "───────" "──────" "────────────"

    jq -r '[.executions[] | .task_id] | unique[]' "$HISTORY_FILE" | \
    while read -r task_id; do
        local runs=$(jq "[.executions[] | select(.task_id == \"$task_id\")] | length" "$HISTORY_FILE")
        local successes=$(jq "[.executions[] | select(.task_id == \"$task_id\" and .status == \"success\")] | length" "$HISTORY_FILE")
        local failures=$(jq "[.executions[] | select(.task_id == \"$task_id\" and .status == \"failed\")] | length" "$HISTORY_FILE")
        local avg_duration=$(jq "[.executions[] | select(.task_id == \"$task_id\") | .duration_seconds] | add / length | floor" "$HISTORY_FILE")

        local avg_duration_formatted=$(format_duration "$avg_duration")

        printf "%-30s %-10s ${GREEN}%-10s${NC} ${RED}%-10s${NC} %-15s\n" \
               "$task_id" "$runs" "$successes" "$failures" "$avg_duration_formatted"
    done

    echo ""

    # Failed Tasks (if any)
    local recent_failures=$(jq '[.executions[-10:] | reverse[] | select(.status == "failed")] | length' "$HISTORY_FILE")

    if [ $recent_failures -gt 0 ]; then
        echo -e "${BOLD}${RED}⚠️  Recent Failures${NC}"
        echo -e "${RED}─────────────────────────────────────────────────────────────────${NC}"

        jq -r '.executions[-10:] | reverse[] | select(.status == "failed") |
               "\(.start_time | split("T")[0] + " " + (split("T")[1] | split("Z")[0]))|\(.task_id)|\(.exit_code)|\(.log_file)"' \
               "$HISTORY_FILE" | \
        while IFS='|' read -r timestamp task_id exit_code log_file; do
            echo -e "  ${RED}✗${NC} [$timestamp] ${BOLD}$task_id${NC} (exit code: $exit_code)"
            echo -e "     Log: $log_file"
        done

        echo ""
    fi

    # Footer
    echo -e "${BLUE}─────────────────────────────────────────────────────────────────${NC}"
    echo -e "Last updated: ${BOLD}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
}

show_task_metrics() {
    local task_id="$1"

    clear

    echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║  📊 Task Metrics: ${task_id}${NC}"
    echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ ! -f "$HISTORY_FILE" ]; then
        echo -e "${YELLOW}No execution history found${NC}"
        return
    fi

    # Check if task exists in history
    local task_executions=$(jq "[.executions[] | select(.task_id == \"$task_id\")] | length" "$HISTORY_FILE")

    if [ $task_executions -eq 0 ]; then
        echo -e "${YELLOW}No execution history for task: $task_id${NC}"
        return
    fi

    # Task Statistics
    echo -e "${BOLD}${CYAN}Task Statistics${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"

    local total_runs=$task_executions
    local successes=$(jq "[.executions[] | select(.task_id == \"$task_id\" and .status == \"success\")] | length" "$HISTORY_FILE")
    local failures=$(jq "[.executions[] | select(.task_id == \"$task_id\" and .status == \"failed\")] | length" "$HISTORY_FILE")
    local success_rate=$(awk "BEGIN {printf \"%.1f\", ($successes / $total_runs) * 100}")

    local avg_duration=$(jq "[.executions[] | select(.task_id == \"$task_id\") | .duration_seconds] | add / length | floor" "$HISTORY_FILE")
    local min_duration=$(jq "[.executions[] | select(.task_id == \"$task_id\") | .duration_seconds] | min" "$HISTORY_FILE")
    local max_duration=$(jq "[.executions[] | select(.task_id == \"$task_id\") | .duration_seconds] | max" "$HISTORY_FILE")

    echo -e "  Total Runs:          ${BOLD}$total_runs${NC}"
    echo -e "  ${GREEN}✓${NC} Successes:         ${GREEN}$successes${NC}"
    echo -e "  ${RED}✗${NC} Failures:          ${RED}$failures${NC}"
    echo -e "  Success Rate:        ${BOLD}${success_rate}%${NC}"
    echo -e "  Avg Duration:        ${BOLD}$(format_duration $avg_duration)${NC}"
    echo -e "  Min Duration:        $(format_duration $min_duration)"
    echo -e "  Max Duration:        $(format_duration $max_duration)"
    echo ""

    # Last 10 Executions
    echo -e "${BOLD}${CYAN}Last 10 Executions${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
    printf "%-20s %-10s %-10s %-30s\n" "TIMESTAMP" "STATUS" "DURATION" "LOG FILE"
    printf "%-20s %-10s %-10s %-30s\n" "──────────" "──────" "────────" "────────"

    jq -r ".executions[] | select(.task_id == \"$task_id\") |
           \"\(.start_time | split(\"T\")[0] + \" \" + (split(\"T\")[1] | split(\"Z\")[0]))|\(.status)|\(.duration_seconds)|\(.log_file)\"" \
           "$HISTORY_FILE" | tail -10 | \
    while IFS='|' read -r timestamp status duration log_file; do
        local status_icon="❓"
        local status_color="$NC"

        if [ "$status" == "success" ]; then
            status_icon="✅"
            status_color="$GREEN"
        elif [ "$status" == "failed" ]; then
            status_icon="❌"
            status_color="$RED"
        fi

        local duration_formatted=$(format_duration "$duration")
        local log_file_short=$(basename "$log_file")

        printf "%-20s ${status_color}%-10s${NC} %-10s %-30s\n" \
               "$timestamp" "$status_icon $status" "$duration_formatted" "$log_file_short"
    done

    echo ""
}

# ========================================
# Main
# ========================================

show_help() {
    cat <<EOF
Miyabi Scheduled Task Monitor

Usage:
  $(basename "$0")                 Show execution dashboard
  $(basename "$0") --watch         Watch mode (auto-refresh every 5s)
  $(basename "$0") --task <id>     Show task-specific metrics
  $(basename "$0") --help          Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --watch
  $(basename "$0") --task ai-blog-daily

Files:
  History file:  $HISTORY_FILE
EOF
}

main() {
    case "${1:-}" in
        --watch|-w)
            while true; do
                show_dashboard
                echo ""
                echo -e "${YELLOW}Refreshing in 5 seconds... (Press Ctrl+C to exit)${NC}"
                sleep 5
            done
            ;;
        --task|-t)
            if [ -z "${2:-}" ]; then
                echo "Error: Task ID required"
                show_help
                exit 1
            fi
            show_task_metrics "$2"
            ;;
        --help|-h|help)
            show_help
            ;;
        "")
            show_dashboard
            ;;
        *)
            echo "Error: Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
