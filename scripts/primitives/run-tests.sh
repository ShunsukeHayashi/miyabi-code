#!/bin/bash
# Primitive Script: Test Runner
# Purpose: Run cargo test and capture results
# Usage: ./run-tests.sh [package_name]
# Exit codes:
#   0 = All tests passed
#   1 = Tests failed
#   2 = Compilation error

set -e

PACKAGE="${1:-}"
LOG_DIR="/tmp/miyabi-automation"
mkdir -p "$LOG_DIR"

echo "====================================="
echo "Miyabi Test Runner"
echo "====================================="

if [ -n "$PACKAGE" ]; then
    echo "Package: $PACKAGE"
    TEST_CMD="cargo test --package $PACKAGE"
else
    echo "Package: All packages"
    TEST_CMD="cargo test --all"
fi

echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Run tests with timeout
echo "Running tests..."
if ! timeout 600 $TEST_CMD > "$LOG_DIR/test-output.log" 2>&1; then
    TEST_EXIT_CODE=$?

    echo ""
    echo "❌ Tests FAILED"
    echo ""
    echo "Last 50 lines of output:"
    tail -50 "$LOG_DIR/test-output.log"

    # Check if it's a compilation error
    if grep -q "error\[E[0-9]\+\]" "$LOG_DIR/test-output.log"; then
        echo ""
        echo "ERROR: Compilation errors detected"
        exit 2
    fi

    exit 1
fi

echo ""
echo "✅ All tests PASSED"
echo ""

# Extract test summary
PASSED=$(grep -oP 'test result: ok\. \K[0-9]+' "$LOG_DIR/test-output.log" | tail -1 || echo "0")
echo "Tests passed: $PASSED"
echo "Full log: $LOG_DIR/test-output.log"

exit 0
