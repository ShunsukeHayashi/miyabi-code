#!/bin/bash
# Miyabi Load Test Runner
# Issue: #853 - Load Test & Performance Test
#
# Usage:
#   ./run_load_test.sh normal
#   ./run_load_test.sh peak
#   ./run_load_test.sh spike
#   ./run_load_test.sh endurance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default values
SCENARIO="${1:-normal}"
API_URL="${API_URL:-http://localhost:4000}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_ROOT/load-test-results}"

# Parse additional arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            API_URL="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --agents)
            AGENTS="$2"
            shift 2
            ;;
        --duration)
            DURATION="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo ""
echo "========================================"
echo "    Miyabi Load Test Runner"
echo "========================================"
echo ""
log_info "Scenario: $SCENARIO"
log_info "Target URL: $API_URL"
log_info "Output Dir: $OUTPUT_DIR"
echo ""

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v python3 &> /dev/null; then
        log_error "python3 is required but not installed"
        exit 1
    fi

    # Check for aiohttp
    if ! python3 -c "import aiohttp" 2>/dev/null; then
        log_warn "Installing aiohttp..."
        pip3 install aiohttp
    fi

    log_success "Dependencies OK"
}

# Check if API is available
check_api() {
    log_info "Checking API availability at $API_URL..."

    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if curl -s -f "${API_URL}/health" > /dev/null 2>&1 || \
           curl -s -f "${API_URL}/api/health" > /dev/null 2>&1; then
            log_success "API is available"
            return 0
        fi

        retry=$((retry + 1))
        log_warn "API not available, retrying ($retry/$max_retries)..."
        sleep 2
    done

    log_error "API is not available at $API_URL"
    log_info "You can skip this check by setting SKIP_API_CHECK=1"

    if [ "${SKIP_API_CHECK:-0}" != "1" ]; then
        exit 1
    fi
}

# Run load test
run_test() {
    log_info "Starting load test..."

    mkdir -p "$OUTPUT_DIR"

    local cmd="python3 $SCRIPT_DIR/load_test.py --scenario $SCENARIO --url $API_URL --output $OUTPUT_DIR"

    if [ -n "$AGENTS" ]; then
        cmd="$cmd --agents $AGENTS"
    fi

    if [ -n "$DURATION" ]; then
        cmd="$cmd --duration $DURATION"
    fi

    log_info "Running: $cmd"
    echo ""

    # Run with unbuffered output
    PYTHONUNBUFFERED=1 $cmd

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "Load test completed successfully"
    else
        log_error "Load test failed with exit code $exit_code"
    fi

    return $exit_code
}

# Generate summary report
generate_summary() {
    log_info "Generating summary report..."

    local latest_report=$(ls -t "$OUTPUT_DIR"/*.json 2>/dev/null | head -1)

    if [ -z "$latest_report" ]; then
        log_warn "No report files found"
        return
    fi

    log_info "Latest report: $latest_report"

    # Parse JSON and create markdown summary
    python3 << EOF
import json
import sys
from pathlib import Path

try:
    with open("$latest_report") as f:
        report = json.load(f)

    metrics = report["metrics"]
    criteria = report["success_criteria"]

    md = f"""# Load Test Summary

## Configuration
- Scenario: {report["scenario"]}
- Agents: {report["config"]["agents"]}
- Duration: {report["config"]["duration"]}s

## Results
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | {metrics["success_rate_percent"]}% | >{criteria["success_rate"]}% | {"PASS" if metrics["success_rate_percent"] >= criteria["success_rate"] else "FAIL"} |
| P95 Response | {metrics["p95_response_time_ms"]/1000:.2f}s | <{criteria["response_time_p95"]}s | {"PASS" if metrics["p95_response_time_ms"]/1000 < criteria["response_time_p95"] else "FAIL"} |
| Total Tasks | {metrics["total_tasks"]} | - | - |
| Failed Tasks | {metrics["failed_tasks"]} | - | - |

## Overall: {"PASSED" if report["passed"] else "FAILED"}

Generated: {report["timestamp"]}
"""

    summary_file = Path("$OUTPUT_DIR") / "SUMMARY.md"
    with open(summary_file, "w") as f:
        f.write(md)

    print(f"Summary saved to: {summary_file}")
except Exception as e:
    print(f"Error generating summary: {e}", file=sys.stderr)
EOF
}

# Main execution
main() {
    check_dependencies

    # Skip API check for dry-run or if env var is set
    if [ "${DRY_RUN:-0}" != "1" ] && [ "${SKIP_API_CHECK:-0}" != "1" ]; then
        check_api
    fi

    run_test
    local result=$?

    generate_summary

    echo ""
    log_info "Results saved to: $OUTPUT_DIR"

    return $result
}

# Handle Ctrl+C
trap 'log_warn "Interrupted by user"; exit 130' INT

main
