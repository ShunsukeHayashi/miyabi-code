#!/bin/bash
# Miyabi LLM Provider Compatibility Test
# Tests both Anthropic and OpenAI providers

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
echo -e "${BLUE}║  LLM Provider Compatibility Test      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verify API keys
ANTHROPIC_AVAILABLE=false
OPENAI_AVAILABLE=false

if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    echo -e "${GREEN}✅ Anthropic API key found${NC}"
    ANTHROPIC_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Anthropic API key not set (skipping Anthropic tests)${NC}"
fi

if [ -n "${OPENAI_API_KEY:-}" ]; then
    echo -e "${GREEN}✅ OpenAI API key found${NC}"
    OPENAI_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  OpenAI API key not set (skipping OpenAI tests)${NC}"
fi

if [ "$ANTHROPIC_AVAILABLE" = false ] && [ "$OPENAI_AVAILABLE" = false ]; then
    echo -e "${RED}❌ No API keys configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY${NC}"
    exit 1
fi

echo ""

# Build miyabi-cli
echo -e "${YELLOW}🔨 Building miyabi-cli...${NC}"
cd "$PROJECT_ROOT"
cargo build --release --package miyabi-cli
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Test functions
test_provider() {
    local provider=$1
    local test_name=$2

    echo -e "${YELLOW}Testing ${provider}: ${test_name}${NC}"

    export LLM_PROVIDER=$provider

    case "$test_name" in
        "basic_chat")
            echo "What is 2+2?" | \
                timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/test_output.txt 2>&1
            if grep -q "4" /tmp/test_output.txt; then
                echo -e "${GREEN}✅ PASS: Basic chat${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL: Basic chat${NC}"
                return 1
            fi
            ;;

        "file_read")
            # Create test file
            echo "Test content" > /tmp/miyabi_test_file.txt

            echo "Read the file /tmp/miyabi_test_file.txt" | \
                timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/test_output.txt 2>&1

            rm -f /tmp/miyabi_test_file.txt

            if grep -q "Test content" /tmp/test_output.txt; then
                echo -e "${GREEN}✅ PASS: File read${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL: File read${NC}"
                return 1
            fi
            ;;

        "file_write")
            echo "Create a file /tmp/miyabi_write_test.txt with content 'Hello from ${provider}'" | \
                timeout 30s ./target/release/miyabi chat --mode file-edits > /tmp/test_output.txt 2>&1

            if [ -f /tmp/miyabi_write_test.txt ]; then
                echo -e "${GREEN}✅ PASS: File write${NC}"
                rm -f /tmp/miyabi_write_test.txt
                return 0
            else
                echo -e "${RED}❌ FAIL: File write${NC}"
                return 1
            fi
            ;;

        "command_execution")
            echo "Execute the command: echo 'Command test from ${provider}'" | \
                timeout 30s ./target/release/miyabi chat --mode full-access > /tmp/test_output.txt 2>&1

            if grep -q "Command test" /tmp/test_output.txt; then
                echo -e "${GREEN}✅ PASS: Command execution${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL: Command execution${NC}"
                return 1
            fi
            ;;

        "parallel_tools")
            echo "List files in these 3 directories: /tmp, /var, /usr" | \
                timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/test_output.txt 2>&1

            if grep -q "tmp\|var\|usr" /tmp/test_output.txt; then
                echo -e "${GREEN}✅ PASS: Parallel tools${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL: Parallel tools${NC}"
                return 1
            fi
            ;;

        *)
            echo -e "${RED}❌ Unknown test: ${test_name}${NC}"
            return 1
            ;;
    esac

    rm -f /tmp/test_output.txt
}

# Test matrix
declare -a TESTS=(
    "basic_chat"
    "file_read"
    "file_write"
    "command_execution"
    "parallel_tools"
)

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test Anthropic
if [ "$ANTHROPIC_AVAILABLE" = true ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Testing Anthropic Claude 3.5 Sonnet  ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""

    for test in "${TESTS[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if test_provider "anthropic" "$test"; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        echo ""
    done
fi

# Test OpenAI
if [ "$OPENAI_AVAILABLE" = true ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Testing OpenAI GPT-4o                ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""

    for test in "${TESTS[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if test_provider "openai" "$test"; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        echo ""
    done
fi

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

# Cleanup
rm -f /tmp/test_output.txt /tmp/miyabi_test_file.txt /tmp/miyabi_write_test.txt

if [ ${FAILED_TESTS} -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All LLM provider tests passed!${NC}"
    exit 0
fi
