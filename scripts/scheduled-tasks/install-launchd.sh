#!/usr/bin/env bash
#
# Install Launchd Jobs for Miyabi Scheduled Tasks (macOS)
# Version: 1.0.0
# Purpose: Generate and install launchd plist files from tasks.yaml
#
# Usage:
#   ./install-launchd.sh                    Install all enabled tasks
#   ./install-launchd.sh --task <id>        Install specific task
#   ./install-launchd.sh --uninstall        Uninstall all tasks
#   ./install-launchd.sh --list             List installed tasks
#

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASKS_FILE="${SCRIPT_DIR}/tasks.yaml"
TASK_RUNNER="${SCRIPT_DIR}/task-runner.sh"
LAUNCHD_DIR="${HOME}/Library/LaunchAgents"
PLIST_PREFIX="com.miyabi.scheduled-tasks"

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

# Check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "This script is for macOS only. Use install-cron.sh for Linux."
        exit 1
    fi
}

# Parse cron schedule to launchd format
cron_to_launchd() {
    local cron_expr="$1"
    local task_id="$2"

    # Parse cron: minute hour day month weekday
    IFS=' ' read -r minute hour day month weekday <<< "$cron_expr"

    local calendar_intervals=""

    # Handle special cases
    case "$minute" in
        "*/30")
            # Every 30 minutes - use multiple StartCalendarInterval
            for i in 0 30; do
                calendar_intervals+="
    <dict>
        <key>Minute</key>
        <integer>$i</integer>
    </dict>"
            done
            ;;
        "0")
            # Hourly or specific time
            if [ "$hour" == "*" ]; then
                # Every hour at :00
                calendar_intervals="
    <dict>
        <key>Minute</key>
        <integer>0</integer>
    </dict>"
            elif [[ "$hour" =~ ^[0-9]+$ ]]; then
                # Specific hour
                calendar_intervals="
    <dict>
        <key>Hour</key>
        <integer>$hour</integer>
        <key>Minute</key>
        <integer>$minute</integer>"

                # Add day if specified
                if [[ "$day" =~ ^[0-9]+$ ]]; then
                    calendar_intervals+="
        <key>Day</key>
        <integer>$day</integer>"
                fi

                # Add weekday if specified
                if [[ "$weekday" =~ ^[0-9]+$ ]]; then
                    calendar_intervals+="
        <key>Weekday</key>
        <integer>$weekday</integer>"
                fi

                calendar_intervals+="
    </dict>"
            fi
            ;;
        *)
            log_warn "Complex cron expression for $task_id: $cron_expr"
            log_warn "Using simplified daily schedule"
            calendar_intervals="
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>"
            ;;
    esac

    echo "$calendar_intervals"
}

# Generate launchd plist for a task
generate_plist() {
    local task_id="$1"
    local plist_path="$2"

    log_info "Generating plist for task: $task_id"

    # Get task configuration
    local task_name=$(yq ".tasks[] | select(.id == \"$task_id\") | .name" "$TASKS_FILE")
    local task_schedule=$(yq ".tasks[] | select(.id == \"$task_id\") | .schedule" "$TASKS_FILE")
    local task_enabled=$(yq ".tasks[] | select(.id == \"$task_id\") | .enabled" "$TASKS_FILE")

    # Check if task is enabled
    if [ "$task_enabled" != "true" ]; then
        log_warn "Task is disabled: $task_id"
        return 1
    fi

    # Convert cron schedule to launchd format
    local calendar_intervals=$(cron_to_launchd "$task_schedule" "$task_id")

    # Generate plist
    cat > "$plist_path" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_PREFIX}.${task_id}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${TASK_RUNNER}</string>
        <string>${task_id}</string>
    </array>

    <key>WorkingDirectory</key>
    <string>${PROJECT_ROOT}</string>

    <key>StartCalendarInterval</key>${calendar_intervals}

    <key>StandardOutPath</key>
    <string>${PROJECT_ROOT}/.ai/logs/scheduled-tasks/launchd-${task_id}-stdout.log</string>

    <key>StandardErrorPath</key>
    <string>${PROJECT_ROOT}/.ai/logs/scheduled-tasks/launchd-${task_id}-stderr.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${HOME}/.cargo/bin</string>
        <key>HOME</key>
        <string>${HOME}</string>
        <key>MIYABI_SCHEDULED_TASK</key>
        <string>true</string>
    </dict>

    <key>RunAtLoad</key>
    <false/>

    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

    log_success "Generated plist: $plist_path"
    return 0
}

# Install a single task
install_task() {
    local task_id="$1"

    local plist_name="${PLIST_PREFIX}.${task_id}.plist"
    local plist_path="${LAUNCHD_DIR}/${plist_name}"

    # Generate plist
    if ! generate_plist "$task_id" "$plist_path"; then
        return 1
    fi

    # Unload if already loaded
    if launchctl list | grep -q "${PLIST_PREFIX}.${task_id}"; then
        log_info "Unloading existing job: $task_id"
        launchctl unload "$plist_path" 2>/dev/null || true
    fi

    # Load the job
    log_info "Loading job: $task_id"
    if launchctl load "$plist_path"; then
        log_success "Installed task: $task_id"
    else
        log_error "Failed to load task: $task_id"
        return 1
    fi

    return 0
}

# Install all enabled tasks
install_all_tasks() {
    log_info "Installing all enabled tasks..."

    # Ensure launchd directory exists
    mkdir -p "$LAUNCHD_DIR"

    local task_count=0
    local success_count=0

    # Get all enabled tasks
    yq '.tasks[] | select(.enabled == true) | .id' "$TASKS_FILE" | \
    while read -r task_id; do
        task_count=$((task_count + 1))

        if install_task "$task_id"; then
            success_count=$((success_count + 1))
        fi

        echo ""
    done

    log_success "Installation complete"
    echo ""
    list_installed_tasks
}

# Uninstall a single task
uninstall_task() {
    local task_id="$1"

    local plist_name="${PLIST_PREFIX}.${task_id}.plist"
    local plist_path="${LAUNCHD_DIR}/${plist_name}"

    if [ ! -f "$plist_path" ]; then
        log_warn "Task not installed: $task_id"
        return 1
    fi

    # Unload the job
    log_info "Unloading job: $task_id"
    if launchctl unload "$plist_path" 2>/dev/null; then
        log_success "Unloaded task: $task_id"
    fi

    # Remove plist file
    rm -f "$plist_path"
    log_success "Removed plist: $task_id"

    return 0
}

# Uninstall all tasks
uninstall_all_tasks() {
    log_info "Uninstalling all Miyabi scheduled tasks..."

    local uninstall_count=0

    # Find all Miyabi task plists
    find "$LAUNCHD_DIR" -name "${PLIST_PREFIX}.*.plist" | \
    while read -r plist_path; do
        local plist_name=$(basename "$plist_path" .plist)
        local task_id="${plist_name#${PLIST_PREFIX}.}"

        if uninstall_task "$task_id"; then
            uninstall_count=$((uninstall_count + 1))
        fi

        echo ""
    done

    log_success "Uninstallation complete"
}

# List installed tasks
list_installed_tasks() {
    log_info "Installed Miyabi scheduled tasks:"
    echo ""

    printf "%-30s %-15s %-30s\n" "TASK ID" "STATUS" "PLIST FILE"
    printf "%-30s %-15s %-30s\n" "-------" "------" "----------"

    find "$LAUNCHD_DIR" -name "${PLIST_PREFIX}.*.plist" | \
    while read -r plist_path; do
        local plist_name=$(basename "$plist_path" .plist)
        local task_id="${plist_name#${PLIST_PREFIX}.}"

        local status="❌ Not Loaded"
        if launchctl list | grep -q "${PLIST_PREFIX}.${task_id}"; then
            status="✅ Loaded"
        fi

        printf "%-30s %-15s %-30s\n" "$task_id" "$status" "$plist_name"
    done

    echo ""
}

# ========================================
# Main
# ========================================

show_help() {
    cat <<EOF
Install Launchd Jobs for Miyabi Scheduled Tasks (macOS)

Usage:
  $(basename "$0")                    Install all enabled tasks
  $(basename "$0") --task <id>        Install specific task
  $(basename "$0") --uninstall        Uninstall all tasks
  $(basename "$0") --list             List installed tasks
  $(basename "$0") --help             Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --task ai-blog-daily
  $(basename "$0") --uninstall
  $(basename "$0") --list

Requirements:
  - macOS (launchd)
  - yq (brew install yq)

Files:
  Tasks config:  $TASKS_FILE
  Launchd dir:   $LAUNCHD_DIR
  Plist prefix:  $PLIST_PREFIX
EOF
}

main() {
    # Check macOS
    check_macos

    # Check dependencies
    if ! command -v yq &> /dev/null; then
        log_error "yq not found. Install with: brew install yq"
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
        --list|-l)
            list_installed_tasks
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
