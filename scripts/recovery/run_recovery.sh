#!/bin/bash
# Miyabi Pixel Recovery Runner
# Issue: #875 - Pixel Termux自動復旧
#
# This script runs the Pixel/Termux auto-recovery system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECOVERY_SCRIPT="${SCRIPT_DIR}/pixel_recovery.py"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    cat << EOF
Miyabi Pixel/Termux Auto-Recovery System

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -d, --dry-run       Show what would be done without making changes
    -j, --json          Output as JSON
    -v, --verbose       Verbose output
    -n, --network NET   Network prefix to scan (e.g., 192.168.1)
    -s, --scan-only     Only scan network, don't recover
    -w, --watch         Continuous monitoring mode
    -i, --interval SEC  Interval between checks in watch mode (default: 60)
    -h, --help          Show this help message

EXAMPLES:
    # Run single recovery attempt
    $0

    # Dry run (see what would be done)
    $0 --dry-run

    # Scan network only
    $0 --scan-only

    # Continuous monitoring
    $0 --watch --interval 120

    # Scan different network
    $0 --network 192.168.1 --scan-only

EXIT CODES:
    0 - Recovery successful or device already online
    1 - Partial recovery
    2 - Recovery failed
EOF
}

# Parse arguments
DRY_RUN=""
JSON_MODE=""
VERBOSE=""
NETWORK=""
SCAN_ONLY=""
WATCH_MODE=""
INTERVAL="60"

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
        -v|--verbose)
            VERBOSE="--verbose"
            shift
            ;;
        -n|--network)
            NETWORK="--network $2"
            shift 2
            ;;
        -s|--scan-only)
            SCAN_ONLY="--scan-only"
            shift
            ;;
        -w|--watch)
            WATCH_MODE="true"
            shift
            ;;
        -i|--interval)
            INTERVAL="$2"
            shift 2
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

# Ensure recovery script exists
if [[ ! -f "${RECOVERY_SCRIPT}" ]]; then
    echo -e "${RED}Error: Recovery script not found: ${RECOVERY_SCRIPT}${NC}"
    exit 1
fi

# Make recovery script executable
chmod +x "${RECOVERY_SCRIPT}"

# Build command
build_cmd() {
    local args=()
    [[ -n "$DRY_RUN" ]] && args+=("$DRY_RUN")
    [[ -n "$JSON_MODE" ]] && args+=("$JSON_MODE")
    [[ -n "$VERBOSE" ]] && args+=("$VERBOSE")
    [[ -n "$NETWORK" ]] && args+=($NETWORK)
    [[ -n "$SCAN_ONLY" ]] && args+=("$SCAN_ONLY")
    echo "${args[@]}"
}

# Run recovery
run_recovery() {
    local args
    args=$(build_cmd)
    python3 "${RECOVERY_SCRIPT}" $args
    return $?
}

# Watch mode
run_watch() {
    echo -e "${BLUE}Starting Pixel recovery watch mode...${NC}"
    echo -e "${BLUE}Interval: ${INTERVAL}s${NC}"
    echo ""

    while true; do
        echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] Running recovery check...${NC}"

        run_recovery
        local exit_code=$?

        case $exit_code in
            0)
                echo -e "${GREEN}Device is online${NC}"
                ;;
            1)
                echo -e "${YELLOW}Partial recovery - will retry${NC}"
                ;;
            2)
                echo -e "${RED}Recovery failed - will retry${NC}"
                ;;
        esac

        echo -e "${BLUE}Next check in ${INTERVAL}s...${NC}"
        echo ""
        sleep "$INTERVAL"
    done
}

# Main
main() {
    if [[ -n "$WATCH_MODE" ]]; then
        run_watch
    else
        echo -e "${BLUE}Starting Miyabi Pixel Recovery...${NC}"
        run_recovery
        local exit_code=$?

        case $exit_code in
            0)
                echo -e "${GREEN}Recovery successful${NC}"
                ;;
            1)
                echo -e "${YELLOW}Partial recovery${NC}"
                ;;
            2)
                echo -e "${RED}Recovery failed${NC}"
                ;;
        esac

        exit $exit_code
    fi
}

main
