#!/bin/bash
# Miyabi OpenAI App - End-to-End Test Suite

set -e

echo "🧪 Miyabi OpenAI App - E2E Test Suite"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Configuration
SERVER_HOST="${SERVER_HOST:-localhost}"
SERVER_PORT="${SERVER_PORT:-8000}"
ASSET_PORT="${ASSET_PORT:-4444}"
BASE_URL="http://${SERVER_HOST}:${SERVER_PORT}"
ASSET_URL="http://${SERVER_HOST}:${ASSET_PORT}"

# Test results array
declare -a TEST_RESULTS

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $test_name"

    # Run test and capture output
    if output=$(eval "$test_command" 2>&1); then
        # Check if output matches expected pattern
        if echo "$output" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}  ✅ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            TEST_RESULTS+=("✅ $test_name")
            return 0
        else
            echo -e "${RED}  ❌ FAIL - Pattern not found: $expected_pattern${NC}"
            echo -e "${YELLOW}  Output: $output${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            TEST_RESULTS+=("❌ $test_name - Pattern not found")
            return 1
        fi
    else
        echo -e "${RED}  ❌ FAIL - Command failed${NC}"
        echo -e "${YELLOW}  Output: $output${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ $test_name - Command failed")
        return 1
    fi
}

# Helper function to test JSON response
test_json_response() {
    local test_name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local expected_field="$5"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $test_name"

    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s "$url")
    fi

    if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ $test_name")
        return 0
    else
        echo -e "${RED}  ❌ FAIL - Field not found: $expected_field${NC}"
        echo -e "${YELLOW}  Response: $response${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ $test_name - Field not found")
        return 1
    fi
}

# Test function with authentication
test_authenticated() {
    local test_name="$1"
    local url="$2"
    local data="$3"
    local expected_field="$4"
    local token="${MIYABI_ACCESS_TOKEN:-}"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $test_name"

    if [ -z "$token" ]; then
        echo -e "${YELLOW}  ⚠️  SKIP - No MIYABI_ACCESS_TOKEN set (dev mode)${NC}"
        return 0
    fi

    response=$(curl -s -X POST "$url" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$data")

    if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ $test_name")
        return 0
    else
        echo -e "${RED}  ❌ FAIL - Field not found: $expected_field${NC}"
        echo -e "${YELLOW}  Response: $response${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ $test_name - Auth test failed")
        return 1
    fi
}

echo "🔧 Configuration:"
echo "  MCP Server: $BASE_URL"
echo "  Asset Server: $ASSET_URL"
echo "  Auth Token: ${MIYABI_ACCESS_TOKEN:+SET}"
echo ""

# ========================================
# Test Suite 1: Server Health Checks
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 1: Server Health Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Asset server is running" \
    "curl -s -o /dev/null -w '%{http_code}' $ASSET_URL" \
    "200"

test_json_response "MCP server health check" \
    "$BASE_URL/" \
    "GET" \
    "" \
    '.name == "Miyabi MCP Server"'

test_json_response "MCP server version info" \
    "$BASE_URL/" \
    "GET" \
    "" \
    '.version == "1.0.0"'

test_json_response "MCP server tools count" \
    "$BASE_URL/" \
    "GET" \
    "" \
    '.tools == 7'

# ========================================
# Test Suite 2: MCP Protocol Endpoints
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 2: MCP Protocol Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_json_response "MCP endpoint info (GET)" \
    "$BASE_URL/mcp" \
    "GET" \
    "" \
    '.name == "Miyabi MCP Server"'

test_json_response "MCP protocol version" \
    "$BASE_URL/mcp" \
    "GET" \
    "" \
    '.protocol == "Model Context Protocol (MCP)"'

test_json_response "MCP available tools list" \
    "$BASE_URL/mcp" \
    "GET" \
    "" \
    '.available_tools | length > 0'

# ========================================
# Test Suite 3: MCP Tools/List
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 3: MCP Tools Discovery${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_json_response "tools/list - MCP protocol" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
    '.result.tools | length == 7'

test_json_response "tools/list - execute_agent tool exists" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
    '.result.tools[] | select(.name == "execute_agent")'

test_json_response "tools/list - execute_agents_parallel tool exists" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
    '.result.tools[] | select(.name == "execute_agents_parallel")'

# ========================================
# Test Suite 4: Tool Execution
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 4: Tool Execution${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_json_response "Execute get_project_status" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_project_status","arguments":{}}}' \
    '.result.content[0].text'

test_json_response "Execute list_agents" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' \
    '.result.content[0].text'

# ========================================
# Test Suite 5: Authentication
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 5: Authentication (OAuth 2.1)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -n "${MIYABI_ACCESS_TOKEN:-}" ]; then
    # Test with valid token
    test_authenticated "Authenticated tools/list" \
        "$BASE_URL/mcp" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
        '.result.tools | length == 7'

    # Test without token (should fail if token is configured)
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} Reject request without token"
    response=$(curl -s -X POST "$BASE_URL/mcp" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')

    if echo "$response" | grep -q "401\|Bearer token required"; then
        echo -e "${GREEN}  ✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ Reject request without token")
    else
        echo -e "${RED}  ❌ FAIL - Should require authentication${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ Reject request without token")
    fi
else
    echo -e "${YELLOW}⚠️  Skipping auth tests - MIYABI_ACCESS_TOKEN not set (dev mode)${NC}"
fi

# ========================================
# Test Suite 6: Error Handling
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 6: Error Handling${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_json_response "Handle unknown method" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"unknown_method"}' \
    '.error.message'

test_json_response "Handle unknown tool" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"unknown_tool","arguments":{}}}' \
    '.error.message'

test_json_response "Handle invalid JSON-RPC" \
    "$BASE_URL/mcp" \
    "POST" \
    '{"invalid":"request"}' \
    'has("error") or has("jsonrpc")'

# ========================================
# Test Results Summary
# ========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Results:"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total Tests:  $TESTS_TOTAL"
echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate pass rate
if [ $TESTS_TOTAL -gt 0 ]; then
    PASS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc)
    echo -e "Pass Rate:    ${PASS_RATE}%"
fi

echo ""

# Exit with failure if any tests failed
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
