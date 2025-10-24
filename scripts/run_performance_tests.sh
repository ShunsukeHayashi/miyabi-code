#!/bin/bash
# Miyabi Performance Test Suite
# Tests parallel execution and resource usage

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
echo -e "${BLUE}║  Miyabi Performance Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verify environment
if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY not set${NC}"
    exit 1
fi

export LLM_PROVIDER=openai

# Build miyabi-cli
echo -e "${YELLOW}🔨 Building miyabi-cli (release mode)...${NC}"
cd "$PROJECT_ROOT"
cargo build --release --package miyabi-cli
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Performance test: Response time
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Test 1: Average Response Time         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

ITERATIONS=5
TOTAL_TIME=0

echo -e "${YELLOW}Running ${ITERATIONS} iterations...${NC}"

for i in $(seq 1 $ITERATIONS); do
    echo -n "  Iteration $i: "

    START_TIME=$(date +%s.%N)

    echo "What is the capital of France?" | \
        timeout 30s ./target/release/miyabi chat --mode read-only > /dev/null 2>&1

    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    TOTAL_TIME=$(echo "$TOTAL_TIME + $DURATION" | bc)

    echo -e "${GREEN}${DURATION}s${NC}"
done

AVG_TIME=$(echo "scale=2; $TOTAL_TIME / $ITERATIONS" | bc)
echo ""
echo -e "📊 Average response time: ${GREEN}${AVG_TIME}s${NC}"

# Check if within acceptable range (< 5s average)
if (( $(echo "$AVG_TIME < 5.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASS: Response time within acceptable range${NC}"
else
    echo -e "${RED}❌ FAIL: Response time too slow (> 5s)${NC}"
fi
echo ""

# Performance test: Parallel tool calling
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Test 2: Parallel Tool Calling         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Testing parallel tool execution...${NC}"

START_TIME=$(date +%s.%N)

echo "List files in these 5 directories: /tmp, /var, /usr, /etc, /opt" | \
    timeout 30s ./target/release/miyabi chat --mode read-only > /tmp/parallel_test.txt 2>&1

END_TIME=$(date +%s.%N)
PARALLEL_DURATION=$(echo "$END_TIME - $START_TIME" | bc)

echo -e "📊 Parallel execution time: ${GREEN}${PARALLEL_DURATION}s${NC}"

# Check if results contain all directories
if grep -q "tmp" /tmp/parallel_test.txt && \
   grep -q "var" /tmp/parallel_test.txt && \
   grep -q "usr" /tmp/parallel_test.txt; then
    echo -e "${GREEN}✅ PASS: Parallel tool calling working${NC}"
else
    echo -e "${RED}❌ FAIL: Parallel tool calling not working properly${NC}"
fi

rm -f /tmp/parallel_test.txt
echo ""

# Performance test: Memory usage
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Test 3: Memory Usage                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Measuring memory usage...${NC}"

# Start miyabi chat in background
echo "Sleep for 5 seconds" | \
    timeout 10s ./target/release/miyabi chat --mode read-only > /dev/null 2>&1 &

MIYABI_PID=$!

# Wait a bit for initialization
sleep 2

# Measure memory (macOS)
if command -v ps &> /dev/null; then
    MEMORY_KB=$(ps -o rss= -p $MIYABI_PID 2>/dev/null || echo "0")
    MEMORY_MB=$(echo "scale=2; $MEMORY_KB / 1024" | bc)

    echo -e "📊 Memory usage: ${GREEN}${MEMORY_MB} MB${NC}"

    # Check if within acceptable range (< 500MB)
    if (( $(echo "$MEMORY_MB < 500.0" | bc -l) )); then
        echo -e "${GREEN}✅ PASS: Memory usage within acceptable range${NC}"
    else
        echo -e "${RED}❌ FAIL: Memory usage too high (> 500MB)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: ps command not available${NC}"
fi

# Wait for background process
wait $MIYABI_PID 2>/dev/null || true

echo ""

# Performance test: File operations throughput
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Test 4: File Operations Throughput    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Testing file write performance...${NC}"

START_TIME=$(date +%s.%N)

echo "Create 5 test files: /tmp/test1.txt, /tmp/test2.txt, /tmp/test3.txt, /tmp/test4.txt, /tmp/test5.txt with content 'Performance test'" | \
    timeout 60s ./target/release/miyabi chat --mode file-edits > /dev/null 2>&1

END_TIME=$(date +%s.%N)
FILE_OPS_DURATION=$(echo "$END_TIME - $START_TIME" | bc)

echo -e "📊 File operations time: ${GREEN}${FILE_OPS_DURATION}s${NC}"

# Count created files
CREATED_FILES=0
for i in {1..5}; do
    if [ -f "/tmp/test${i}.txt" ]; then
        CREATED_FILES=$((CREATED_FILES + 1))
        rm -f "/tmp/test${i}.txt"
    fi
done

echo -e "📊 Files created: ${GREEN}${CREATED_FILES}/5${NC}"

if [ $CREATED_FILES -ge 3 ]; then
    echo -e "${GREEN}✅ PASS: File operations working${NC}"
else
    echo -e "${RED}❌ FAIL: File operations not working properly${NC}"
fi

echo ""

# Print final summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Performance Summary                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Average Response Time:  ${GREEN}${AVG_TIME}s${NC}"
echo -e "Parallel Execution:     ${GREEN}${PARALLEL_DURATION}s${NC}"
echo -e "File Operations:        ${GREEN}${FILE_OPS_DURATION}s${NC}"
echo -e "Memory Usage:           ${GREEN}${MEMORY_MB:-N/A} MB${NC}"
echo ""
echo -e "${GREEN}✅ Performance tests complete${NC}"
