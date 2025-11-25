#!/bin/bash
# Miyabi Failure Prediction System Runner
# Issue: #877 - 障害予測システム
#
# This script runs the failure prediction system and handles output

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREDICTOR="${SCRIPT_DIR}/failure_predictor.py"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    cat << EOF
Miyabi Failure Prediction System

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -j, --json          Output as JSON
    -w, --watch         Continuous monitoring mode
    -i, --interval SEC  Interval between checks (default: 300)
    -s, --slack         Send alerts to Slack (requires SLACK_WEBHOOK_URL)
    -g, --github        Create GitHub issue on critical findings
    -q, --quiet         Suppress non-critical output
    -h, --help          Show this help message

EXAMPLES:
    # Run single prediction
    $0

    # Continuous monitoring every 5 minutes
    $0 --watch --interval 300

    # JSON output for scripting
    $0 --json

    # Alert to Slack on critical findings
    $0 --watch --slack

EXIT CODES:
    0 - System healthy
    1 - Critical issues detected
    2 - Failure imminent

ENVIRONMENT VARIABLES:
    SLACK_WEBHOOK_URL   - Slack webhook for alerts
    GITHUB_TOKEN        - GitHub token for issue creation
    MIYABI_ROOT         - Miyabi project root directory
EOF
}

# Parse arguments
JSON_MODE=""
WATCH_MODE=""
INTERVAL="300"
SLACK_ALERT=""
GITHUB_ISSUE=""
QUIET=""

while [[ $# -gt 0 ]]; do
    case $1 in
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
        -g|--github)
            GITHUB_ISSUE="true"
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

# Ensure predictor script exists
if [[ ! -f "${PREDICTOR}" ]]; then
    echo -e "${RED}Error: Predictor script not found: ${PREDICTOR}${NC}"
    exit 1
fi

# Make predictor executable
chmod +x "${PREDICTOR}"

# Function to send Slack alert
send_slack_alert() {
    local message="$1"
    local level="$2"

    if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
        [[ -z "$QUIET" ]] && echo -e "${YELLOW}Warning: SLACK_WEBHOOK_URL not set, skipping Slack alert${NC}"
        return
    fi

    local color="good"
    case "$level" in
        warning) color="warning" ;;
        critical|failure_imminent) color="danger" ;;
    esac

    curl -s -X POST -H 'Content-type: application/json' \
        --data "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${message}\",\"footer\":\"Miyabi Failure Prediction System\"}]}" \
        "${SLACK_WEBHOOK_URL}" > /dev/null 2>&1 || true
}

# Function to create GitHub issue
create_github_issue() {
    local title="$1"
    local body="$2"

    if [[ -z "${GITHUB_TOKEN:-}" ]]; then
        [[ -z "$QUIET" ]] && echo -e "${YELLOW}Warning: GITHUB_TOKEN not set, skipping GitHub issue${NC}"
        return
    fi

    gh issue create --title "${title}" --body "${body}" --label "type:bug,priority:P1-Critical" 2>/dev/null || true
}

# Run prediction
run_prediction() {
    local args=()
    [[ -n "$JSON_MODE" ]] && args+=("$JSON_MODE")
    [[ -n "$WATCH_MODE" ]] && args+=("$WATCH_MODE" "--interval" "$INTERVAL")

    if [[ -n "$JSON_MODE" ]] && [[ -n "$SLACK_ALERT" || -n "$GITHUB_ISSUE" ]]; then
        # Capture JSON output for processing
        local output
        output=$(python3 "${PREDICTOR}" "${args[@]}" 2>&1) || true
        local exit_code=$?

        # Parse JSON output
        local health
        health=$(echo "$output" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('overall_health', 'unknown'))" 2>/dev/null || echo "unknown")

        # Send alerts if needed
        if [[ "$health" == "critical" || "$health" == "failure_imminent" ]]; then
            local message="Miyabi System Alert: ${health^^}\n\nReview the prediction report for details."

            [[ -n "$SLACK_ALERT" ]] && send_slack_alert "$message" "$health"
            [[ -n "$GITHUB_ISSUE" ]] && create_github_issue "[AUTO] Failure Prediction Alert: ${health}" "Automated alert from failure prediction system.\n\nHealth: ${health}\n\nPlease investigate immediately."
        fi

        echo "$output"
        return $exit_code
    else
        # Run directly
        python3 "${PREDICTOR}" "${args[@]}"
        return $?
    fi
}

# Main
main() {
    [[ -z "$QUIET" ]] && echo -e "${BLUE}Starting Miyabi Failure Prediction System...${NC}"

    run_prediction
    local exit_code=$?

    case $exit_code in
        0)
            [[ -z "$QUIET" ]] && echo -e "${GREEN}System healthy${NC}"
            ;;
        1)
            [[ -z "$QUIET" ]] && echo -e "${YELLOW}Critical issues detected${NC}"
            ;;
        2)
            [[ -z "$QUIET" ]] && echo -e "${RED}FAILURE IMMINENT${NC}"
            ;;
    esac

    exit $exit_code
}

main
