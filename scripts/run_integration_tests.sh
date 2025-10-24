#!/bin/bash
# Miyabi Integration Test Suite
# Tests all 21 agents sequentially

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Miyabi Integration Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
declare -a FAILED_AGENTS=()

# Function to run individual agent test
run_agent_test() {
    local agent_name=$1
    local provider=${2:-openai}

    echo -e "${YELLOW}Testing: ${agent_name} (${provider})${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if "$SCRIPT_DIR/test_agent.sh" "$agent_name" "$provider" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: ${agent_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL: ${agent_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_AGENTS+=("$agent_name")
    fi
    echo ""
}

# Verify environment
echo -e "${YELLOW}🔍 Verifying environment...${NC}"

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo -e "${RED}❌ GITHUB_TOKEN not set${NC}"
    exit 1
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment verified${NC}"
echo ""

# Build miyabi-cli
echo -e "${YELLOW}🔨 Building miyabi-cli...${NC}"
cd "$PROJECT_ROOT"
cargo build --release --package miyabi-cli
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Run unit tests first
echo -e "${YELLOW}🧪 Running unit tests...${NC}"
if cargo test --all --quiet; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi
echo ""

# Test Coding Agents (7)
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Coding Agents (7)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

run_agent_test "coordinator"
run_agent_test "codegen"
run_agent_test "review"
run_agent_test "issue"
run_agent_test "pr"
run_agent_test "deployment"
run_agent_test "refresher"

# Test Business Agents (14)
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Business Agents (14)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Strategy & Planning (6)
run_agent_test "ai-entrepreneur"
run_agent_test "product-concept"
run_agent_test "product-design"
run_agent_test "funnel-design"
run_agent_test "persona"
run_agent_test "self-analysis"

# Marketing (5)
run_agent_test "market-research"
run_agent_test "marketing"
run_agent_test "content-creation"
run_agent_test "sns-strategy"
run_agent_test "youtube"

# Sales & CRM (3)
run_agent_test "sales"
run_agent_test "crm"
run_agent_test "analytics"

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ ${FAILED_TESTS} -gt 0 ]; then
    echo -e "${RED}Failed Agents:${NC}"
    for agent in "${FAILED_AGENTS[@]}"; do
        echo -e "  ${RED}❌ ${agent}${NC}"
    done
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
