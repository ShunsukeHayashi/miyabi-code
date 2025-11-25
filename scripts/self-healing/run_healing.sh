#!/bin/bash
# Miyabi Self-Healing System Runner
# Issue: #878 - 自己修復機能
#
# This script runs the self-healing system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALER="${SCRIPT_DIR}/self_healer.py"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    cat << EOF
Miyabi Self-Healing System

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -d, --dry-run       Show what would be done without making changes
    -j, --json          Output as JSON
    -w, --watch         Continuous healing mode
    -i, --interval SEC  Interval between checks (default: 300)
    -s, --slack         Send alerts to Slack
    -q, --quiet         Suppress non-critical output
    -h, --help          Show this help message

EXAMPLES:
    # Run single healing pass
    $0

    # Dry run (see what would be done)
    $0 --dry-run

    # Continuous monitoring and healing
    $0 --watch --interval 300

    # JSON output for scripting
    $0 --json

HEALING ACTIONS:
    - cleanup_disk      Clean up disk space
    - cleanup_worktrees Remove old git worktrees
    - kill_zombies      Kill zombie processes
    - fix_git_locks     Remove stale git locks
    - prune_logs        Clean up old log files
    - clear_cache       Clear system caches

EXIT CODES:
    0 - All issues healed
    1 - Some issues remain
EOF
}

# Parse arguments
DRY_RUN=""
JSON_MODE=""
WATCH_MODE=""
INTERVAL="300"
SLACK_ALERT=""
QUIET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        -j|--json)
            JSON_MODE="--json"
            shift
            ;;
        -w|--watch)
            WATCH_MODE="--watch"
            shift
            ;;
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -s|--slack)
            SLACK_ALERT="true"
            shift
            ;;
        -q|--quiet)
            QUIET="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is required${NC}"
    exit 1
fi

# Ensure healer script exists
if [[ ! -f "${HEALER}" ]]; then
    echo -e "${RED}Error: Healer script not found: ${HEALER}${NC}"
    exit 1
fi

# Make healer executable
chmod +x "${HEALER}"

# Function to send Slack notification
send_slack_notification() {
    local message="$1"
    local success="$2"

    if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
        [[ -z "$QUIET" ]] && echo -e "${YELLOW}Warning: SLACK_WEBHOOK_URL not set${NC}"
        return
    fi

    local color="good"
    [[ "$success" != "true" ]] && color="danger"

    curl -s -X POST -H 'Content-type: application/json' \
        --data "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${message}\",\"footer\":\"Miyabi Self-Healing System\"}]}" \
        "${SLACK_WEBHOOK_URL}" > /dev/null 2>&1 || true
}

# Run healing
run_healing() {
    local args=()
    [[ -n "$DRY_RUN" ]] && args+=("$DRY_RUN")
    [[ -n "$JSON_MODE" ]] && args+=("$JSON_MODE")
    [[ -n "$WATCH_MODE" ]] && args+=("$WATCH_MODE" "--interval" "$INTERVAL")

    if [[ -n "$JSON_MODE" ]] && [[ -n "$SLACK_ALERT" ]]; then
        local output
        output=$(python3 "${HEALER}" "${args[@]}" 2>&1) || true
        local exit_code=$?

        # Parse JSON for status
        local success
        success=$(echo "$output" | python3 -c "import sys, json; d=json.load(sys.stdin); print('true' if d.get('overall_success', False) else 'false')" 2>/dev/null || echo "false")

        # Send Slack notification
        if [[ -n "$SLACK_ALERT" ]] && [[ "$success" != "true" ]]; then
            send_slack_notification "Miyabi Self-Healing: Some issues could not be resolved. Manual intervention may be required." "$success"
        fi

        echo "$output"
        return $exit_code
    else
        python3 "${HEALER}" "${args[@]}"
        return $?
    fi
}

# Main
main() {
    [[ -z "$QUIET" ]] && echo -e "${BLUE}Starting Miyabi Self-Healing System...${NC}"

    run_healing
    local exit_code=$?

    case $exit_code in
        0)
            [[ -z "$QUIET" ]] && echo -e "${GREEN}All issues healed${NC}"
            ;;
        1)
            [[ -z "$QUIET" ]] && echo -e "${YELLOW}Some issues remain${NC}"
            ;;
    esac

    exit $exit_code
}

main
