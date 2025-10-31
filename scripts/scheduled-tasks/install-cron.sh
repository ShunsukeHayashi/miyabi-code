#!/usr/bin/env bash
#
# Install Cron Jobs for Miyabi Scheduled Tasks (Linux)
# Version: 1.0.0
# Purpose: Generate and install cron jobs from tasks.yaml
#
# Usage:
#   ./install-cron.sh                    Install all enabled tasks
#   ./install-cron.sh --task <id>        Install specific task
#   ./install-cron.sh --uninstall        Uninstall all tasks
#   ./install-cron.sh --list             List installed tasks
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASKS_FILE="${SCRIPT_DIR}/tasks.yaml"
TASK_RUNNER="${SCRIPT_DIR}/task-runner.sh"
CRON_MARKER="# Miyabi Scheduled Tasks"
TEMP_CRON="/tmp/miyabi-cron-$$.txt"

# Colors
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# ========================================
# Utility Functions
# ========================================

log_info() {
    echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $*${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

log_error() {
    echo -e "${RED}❌ $*${NC}"
}

# Cleanup temp files
cleanup() {
    rm -f "$TEMP_CRON"
}

trap cleanup EXIT

# ========================================
# Cron Functions
# ========================================

# Generate cron entry for a task
generate_cron_entry() {
    local task_id="$1"

    # Get task configuration
    local task_schedule=$(yq ".tasks[] | select(.id == \"$task_id\") | .schedule" "$TASKS_FILE")
    local task_enabled=$(yq ".tasks[] | select(.id == \"$task_id\") | .enabled" "$TASKS_FILE")

    # Check if task is enabled
    if [ "$task_enabled" != "true" ]; then
        return 1
    fi

    # Generate cron entry
    echo "${task_schedule} cd ${PROJECT_ROOT} && ${TASK_RUNNER} ${task_id} >> ${PROJECT_ROOT}/.ai/logs/scheduled-tasks/cron-${task_id}.log 2>&1"
}

# Install all enabled tasks
install_all_tasks() {
    log_info "Installing all enabled tasks to crontab..."

    # Get current crontab (excluding Miyabi tasks)
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "^#.*Miyabi task:" > "$TEMP_CRON" || true

    # Add Miyabi tasks section
    echo "" >> "$TEMP_CRON"
    echo "$CRON_MARKER - Start" >> "$TEMP_CRON"
    echo "# Generated: $(date)" >> "$TEMP_CRON"
    echo "" >> "$TEMP_CRON"

    local task_count=0

    # Get all enabled tasks
    yq '.tasks[] | select(.enabled == true) | .id' "$TASKS_FILE" | \
    while read -r task_id; do
        local task_name=$(yq ".tasks[] | select(.id == \"$task_id\") | .name" "$TASKS_FILE")

        echo "# Miyabi task: $task_name" >> "$TEMP_CRON"

        if generate_cron_entry "$task_id" >> "$TEMP_CRON"; then
            log_info "Added task: $task_id"
            task_count=$((task_count + 1))
        fi

        echo "" >> "$TEMP_CRON"
    done

    echo "$CRON_MARKER - End" >> "$TEMP_CRON"

    # Install new crontab
    if crontab "$TEMP_CRON"; then
        log_success "Crontab updated successfully"
        echo ""
        list_installed_tasks
    else
        log_error "Failed to update crontab"
        exit 1
    fi
}

# Install a single task
install_task() {
    local task_id="$1"

    log_info "Installing task: $task_id"

    # Get current crontab
    crontab -l 2>/dev/null > "$TEMP_CRON" || true

    # Check if task already exists
    if grep -q "^#.*Miyabi task:.*$task_id" "$TEMP_CRON"; then
        log_warn "Task already installed: $task_id"
        log_info "Updating existing entry..."

        # Remove old entry
        grep -v "# Miyabi task:.*$task_id" "$TEMP_CRON" > "${TEMP_CRON}.tmp"
        grep -v "${TASK_RUNNER} ${task_id}" "${TEMP_CRON}.tmp" > "$TEMP_CRON"
        rm "${TEMP_CRON}.tmp"
    fi

    # Check if Miyabi section exists
    if ! grep -q "$CRON_MARKER" "$TEMP_CRON"; then
        echo "" >> "$TEMP_CRON"
        echo "$CRON_MARKER - Start" >> "$TEMP_CRON"
        echo "$CRON_MARKER - End" >> "$TEMP_CRON"
    fi

    # Add task before the End marker
    local task_name=$(yq ".tasks[] | select(.id == \"$task_id\") | .name" "$TASKS_FILE")
    local cron_entry=$(generate_cron_entry "$task_id")

    # Insert before End marker
    sed -i.bak "/${CRON_MARKER} - End/i\\
# Miyabi task: $task_name\\
$cron_entry\\
" "$TEMP_CRON"

    # Install new crontab
    if crontab "$TEMP_CRON"; then
        log_success "Task installed: $task_id"
    else
        log_error "Failed to install task: $task_id"
        exit 1
    fi
}

# Uninstall all tasks
uninstall_all_tasks() {
    log_info "Uninstalling all Miyabi scheduled tasks..."

    # Get current crontab (excluding Miyabi tasks)
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "^#.*Miyabi task:" > "$TEMP_CRON" || true

    # Remove any remaining Miyabi cron entries
    grep -v "${TASK_RUNNER}" "$TEMP_CRON" > "${TEMP_CRON}.tmp" || true
    mv "${TEMP_CRON}.tmp" "$TEMP_CRON"

    # Install new crontab
    if crontab "$TEMP_CRON"; then
        log_success "All Miyabi tasks uninstalled"
    else
        log_error "Failed to update crontab"
        exit 1
    fi
}

# Uninstall a single task
uninstall_task() {
    local task_id="$1"

    log_info "Uninstalling task: $task_id"

    # Get current crontab
    crontab -l 2>/dev/null > "$TEMP_CRON" || true

    # Remove task entry
    grep -v "# Miyabi task:.*$task_id" "$TEMP_CRON" > "${TEMP_CRON}.tmp"
    grep -v "${TASK_RUNNER} ${task_id}" "${TEMP_CRON}.tmp" > "$TEMP_CRON"
    rm "${TEMP_CRON}.tmp"

    # Install new crontab
    if crontab "$TEMP_CRON"; then
        log_success "Task uninstalled: $task_id"
    else
        log_error "Failed to uninstall task: $task_id"
        exit 1
    fi
}

# List installed tasks
list_installed_tasks() {
    log_info "Installed Miyabi scheduled tasks:"
    echo ""

    printf "%-30s %-15s %-20s\n" "TASK ID" "STATUS" "SCHEDULE"
    printf "%-30s %-15s %-20s\n" "-------" "------" "--------"

    # Get Miyabi tasks from crontab
    crontab -l 2>/dev/null | grep "${TASK_RUNNER}" | \
    while read -r cron_entry; do
        # Extract task ID and schedule
        local task_id=$(echo "$cron_entry" | sed -n "s/.*${TASK_RUNNER} \([^ ]*\).*/\1/p")
        local schedule=$(echo "$cron_entry" | awk '{print $1, $2, $3, $4, $5}')

        printf "%-30s %-15s %-20s\n" "$task_id" "✅ Installed" "$schedule"
    done

    echo ""
}

# Show current crontab
show_crontab() {
    log_info "Current crontab (Miyabi tasks only):"
    echo ""

    crontab -l 2>/dev/null | sed -n "/$CRON_MARKER - Start/,/$CRON_MARKER - End/p"

    echo ""
}

# ========================================
# Main
# ========================================

show_help() {
    cat <<EOF
Install Cron Jobs for Miyabi Scheduled Tasks (Linux)

Usage:
  $(basename "$0")                    Install all enabled tasks
  $(basename "$0") --task <id>        Install specific task
  $(basename "$0") --uninstall        Uninstall all tasks
  $(basename "$0") --uninstall-task <id>  Uninstall specific task
  $(basename "$0") --list             List installed tasks
  $(basename "$0") --show             Show current crontab
  $(basename "$0") --help             Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --task ai-blog-daily
  $(basename "$0") --uninstall
  $(basename "$0") --list

Requirements:
  - Linux (cron)
  - yq (install from: https://github.com/mikefarah/yq)

Files:
  Tasks config:  $TASKS_FILE
  Task runner:   $TASK_RUNNER
EOF
}

main() {
    # Check dependencies
    if ! command -v yq &> /dev/null; then
        log_error "yq not found. Install from: https://github.com/mikefarah/yq"
        exit 1
    fi

    case "${1:-}" in
        --task|-t)
            if [ -z "${2:-}" ]; then
                log_error "Task ID required"
                show_help
                exit 1
            fi
            install_task "$2"
            ;;
        --uninstall|-u)
            uninstall_all_tasks
            ;;
        --uninstall-task)
            if [ -z "${2:-}" ]; then
                log_error "Task ID required"
                show_help
                exit 1
            fi
            uninstall_task "$2"
            ;;
        --list|-l)
            list_installed_tasks
            ;;
        --show|-s)
            show_crontab
            ;;
        --help|-h|help)
            show_help
            ;;
        "")
            install_all_tasks
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
