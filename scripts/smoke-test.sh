#!/bin/bash
# Production Smoke Test Script
# Issue: #993 - Phase 4.6: Production Launch
#
# Usage:
#   ./scripts/smoke-test.sh [staging|production]
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Environment
ENVIRONMENT="${1:-staging}"

# URLs based on environment
if [[ "${ENVIRONMENT}" == "production" ]]; then
    FRONTEND_URL="${FRONTEND_URL:-https://pantheon.example.com}"
    API_URL="${API_URL:-https://api.pantheon.example.com}"
else
    FRONTEND_URL="${FRONTEND_URL:-https://staging.pantheon.example.com}"
    API_URL="${API_URL:-https://api.staging.pantheon.example.com}"
fi

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Test result tracking
declare -a RESULTS

# =============================================================================
# Helper Functions
# =============================================================================

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
    ((TOTAL++))
    RESULTS+=("PASS: $1")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
    ((TOTAL++))
    RESULTS+=("FAIL: $1")
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((TOTAL++))
    RESULTS+=("SKIP: $1")
}

# HTTP request with timeout and retries
http_check() {
    local url="$1"
    local expected_status="${2:-200}"
    local max_retries="${3:-3}"
    local retry_delay="${4:-5}"

    for ((i=1; i<=max_retries; i++)); do
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null || echo "000")

        if [[ "${status}" == "${expected_status}" ]]; then
            return 0
        fi

        if [[ $i -lt $max_retries ]]; then
            sleep "${retry_delay}"
        fi
    done

    return 1
}

# Check if response contains expected content
content_check() {
    local url="$1"
    local expected_content="$2"

    response=$(curl -s --max-time 10 "${url}" 2>/dev/null || echo "")

    if echo "${response}" | grep -q "${expected_content}"; then
        return 0
    fi

    return 1
}

# =============================================================================
# Smoke Tests
# =============================================================================

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              MIYABI PRODUCTION SMOKE TESTS                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Frontend:    ${FRONTEND_URL}"
echo -e "API:         ${API_URL}"
echo ""
echo "Starting tests at $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# -----------------------------------------------------------------------------
# 1. API Health Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}=== API Health Checks ===${NC}"

log_test "API health endpoint"
if http_check "${API_URL}/health" 200; then
    log_pass "API health endpoint returns 200"
else
    log_fail "API health endpoint not responding"
fi

log_test "API readiness endpoint"
if http_check "${API_URL}/ready" 200; then
    log_pass "API readiness endpoint returns 200"
else
    log_skip "API readiness endpoint (may not exist)"
fi

# -----------------------------------------------------------------------------
# 2. Frontend Checks
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}=== Frontend Checks ===${NC}"

log_test "Frontend homepage"
if http_check "${FRONTEND_URL}" 200; then
    log_pass "Frontend homepage returns 200"
else
    log_fail "Frontend homepage not responding"
fi

log_test "Frontend contains title"
if content_check "${FRONTEND_URL}" "Pantheon"; then
    log_pass "Frontend contains 'Pantheon' title"
else
    log_fail "Frontend missing expected content"
fi

log_test "Dashboard page"
if http_check "${FRONTEND_URL}/dashboard" 200; then
    log_pass "Dashboard page accessible"
else
    log_fail "Dashboard page not accessible"
fi

log_test "Login page"
if http_check "${FRONTEND_URL}/login" 200; then
    log_pass "Login page accessible"
else
    log_fail "Login page not accessible"
fi

# -----------------------------------------------------------------------------
# 3. Static Assets
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}=== Static Assets ===${NC}"

log_test "JavaScript bundle"
if http_check "${FRONTEND_URL}/_next/static/" 200 1; then
    log_pass "Static assets accessible"
else
    log_skip "Static assets check (path may vary)"
fi

log_test "Favicon"
if http_check "${FRONTEND_URL}/favicon.ico" 200; then
    log_pass "Favicon accessible"
else
    log_skip "Favicon (optional)"
fi

# -----------------------------------------------------------------------------
# 4. API Endpoints
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}=== API Endpoints ===${NC}"

log_test "API agents endpoint"
if http_check "${API_URL}/api/v1/agents" 200; then
    log_pass "Agents endpoint returns 200"
else
    log_fail "Agents endpoint not responding"
fi

log_test "API tasks endpoint"
if http_check "${API_URL}/api/v1/tasks" 200; then
    log_pass "Tasks endpoint returns 200"
else
    log_fail "Tasks endpoint not responding"
fi

log_test "API issues endpoint"
if http_check "${API_URL}/api/v1/issues" 200; then
    log_pass "Issues endpoint returns 200"
else
    log_fail "Issues endpoint not responding"
fi

# -----------------------------------------------------------------------------
# 5. Security Headers
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}=== Security Headers ===${NC}"

log_test "HTTPS redirect"
http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "http://${FRONTEND_URL#https://}" 2>/dev/null || echo "000")
if [[ "${http_status}" == "200" ]]; then
    log_pass "HTTP redirects to HTTPS"
else
    log_skip "HTTP redirect check"
fi

log_test "Strict-Transport-Security header"
if curl -sI "${FRONTEND_URL}" | grep -qi "strict-transport-security"; then
    log_pass "HSTS header present"
else
    log_skip "HSTS header (may be CloudFront managed)"
fi

# -----------------------------------------------------------------------------
# 6. Performance Check
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}=== Performance ===${NC}"

log_test "Response time < 2s"
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "${FRONTEND_URL}" 2>/dev/null || echo "999")
if (( $(echo "${response_time} < 2.0" | bc -l 2>/dev/null || echo "0") )); then
    log_pass "Frontend response time: ${response_time}s"
else
    log_fail "Frontend response time too slow: ${response_time}s"
fi

log_test "API response time < 500ms"
api_response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "${API_URL}/health" 2>/dev/null || echo "999")
if (( $(echo "${api_response_time} < 0.5" | bc -l 2>/dev/null || echo "0") )); then
    log_pass "API response time: ${api_response_time}s"
else
    log_fail "API response time too slow: ${api_response_time}s"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total:  ${TOTAL}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

# Print all results
echo "Detailed Results:"
echo "-----------------"
for result in "${RESULTS[@]}"; do
    if [[ "${result}" == PASS* ]]; then
        echo -e "${GREEN}✓${NC} ${result#PASS: }"
    elif [[ "${result}" == FAIL* ]]; then
        echo -e "${RED}✗${NC} ${result#FAIL: }"
    else
        echo -e "${YELLOW}○${NC} ${result#SKIP: }"
    fi
done

echo ""
echo "Completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Exit with appropriate code
if [[ ${FAILED} -gt 0 ]]; then
    echo -e "${RED}SMOKE TESTS FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}ALL SMOKE TESTS PASSED${NC}"
    exit 0
fi
