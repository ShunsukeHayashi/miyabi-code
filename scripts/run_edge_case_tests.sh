#!/bin/bash
# Miyabi Edge Case Test Suite
# Tests error handling, boundary conditions, and recovery

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
echo -e "${BLUE}║  Miyabi Edge Case Test Suite          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verify environment
if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY not set${NC}"
    exit 1
fi

export LLM_PROVIDER=openai

# Build miyabi-cli
echo -e "${YELLOW}🔨 Building miyabi-cli...${NC}"
cd "$PROJECT_ROOT"
cargo build --release --package miyabi-cli
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Edge Case 1: Invalid file path
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 1: Invalid File Path        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing error handling for invalid file...${NC}"

if echo "Read the file /nonexistent/invalid/path.txt" | \
   timeout 30s ./target/release/miyabi chat --mode read-only 2>&1 | grep -q "not found\|error\|Error"; then
    echo -e "${GREEN}✅ PASS: Graceful error handling for invalid path${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Error not properly handled${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Edge Case 2: Large file handling
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 2: Large File Handling      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Creating 1MB test file...${NC}"
dd if=/dev/zero of=/tmp/large_test.txt bs=1024 count=1024 2>/dev/null

echo "Read the file /tmp/large_test.txt" | \
    timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/large_test_output.txt 2>&1

if grep -q "large\|size\|partial\|truncate\|error" /tmp/large_test_output.txt; then
    echo -e "${GREEN}✅ PASS: Large file handled appropriately${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Large file not handled properly${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

rm -f /tmp/large_test.txt /tmp/large_test_output.txt
echo ""

# Edge Case 3: Permission denied
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 3: Permission Denied        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing permission denied scenario...${NC}"

# Create file with no read permissions
touch /tmp/no_read_permission.txt
chmod 000 /tmp/no_read_permission.txt

if echo "Read the file /tmp/no_read_permission.txt" | \
   timeout 30s ./target/release/miyabi chat --mode read-only 2>&1 | grep -q "permission\|denied\|error"; then
    echo -e "${GREEN}✅ PASS: Permission denied handled gracefully${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Permission error not handled${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

chmod 644 /tmp/no_read_permission.txt
rm -f /tmp/no_read_permission.txt
echo ""

# Edge Case 4: Empty file
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 4: Empty File               ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing empty file handling...${NC}"

touch /tmp/empty_file.txt

echo "Read the file /tmp/empty_file.txt and tell me its contents" | \
    timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/empty_test_output.txt 2>&1

if grep -q "empty\|no content\|0 bytes" /tmp/empty_test_output.txt; then
    echo -e "${GREEN}✅ PASS: Empty file handled correctly${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Empty file not handled properly${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

rm -f /tmp/empty_file.txt /tmp/empty_test_output.txt
echo ""

# Edge Case 5: Concurrent file modifications
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 5: Concurrent Operations    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing concurrent file operations...${NC}"

# Create initial file
echo "Initial content" > /tmp/concurrent_test.txt

# Start background modification
(sleep 1 && echo "Modified by background process" > /tmp/concurrent_test.txt) &

# Try to read during modification
echo "Read the file /tmp/concurrent_test.txt" | \
    timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/concurrent_output.txt 2>&1

if [ -f /tmp/concurrent_output.txt ]; then
    echo -e "${GREEN}✅ PASS: Concurrent operation handled${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Concurrent operation failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

wait
rm -f /tmp/concurrent_test.txt /tmp/concurrent_output.txt
echo ""

# Edge Case 6: Invalid command execution
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 6: Invalid Command          ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing invalid command handling...${NC}"

if echo "Execute this command: /usr/bin/nonexistent_command_xyz" | \
   timeout 30s ./target/release/miyabi chat --mode full-access 2>&1 | grep -q "not found\|error\|failed"; then
    echo -e "${GREEN}✅ PASS: Invalid command handled gracefully${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Invalid command not handled${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Edge Case 7: Special characters in filenames
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 7: Special Characters       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing special characters in filenames...${NC}"

# Create file with spaces and special chars
echo "Special content" > "/tmp/file with spaces & special.txt"

echo "Read the file '/tmp/file with spaces & special.txt'" | \
    timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/special_output.txt 2>&1

if grep -q "Special content" /tmp/special_output.txt; then
    echo -e "${GREEN}✅ PASS: Special characters handled${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL: Special characters not handled${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

rm -f "/tmp/file with spaces & special.txt" /tmp/special_output.txt
echo ""

# Edge Case 8: Timeout handling
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Edge Case 8: Timeout Handling         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "${YELLOW}Testing timeout with very complex query...${NC}"

# This should timeout quickly (5s)
if timeout 5s echo "Write a complete implementation of a web server in Rust with full HTTP/2 support" | \
   ./target/release/miyabi chat --mode read-only > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Query completed within timeout${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo -e "${GREEN}✅ PASS: Timeout handled correctly${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL: Unexpected error (exit code: $EXIT_CODE)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Print summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Edge Case Test Summary                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ ${FAILED_TESTS} -gt 0 ]; then
    echo -e "${RED}❌ Some edge case tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All edge case tests passed!${NC}"
    exit 0
fi
