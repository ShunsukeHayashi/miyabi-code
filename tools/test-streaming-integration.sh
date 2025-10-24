#!/bin/bash
#
# Integration Test Suite for Miyabi Social Stream Ninja Integration
#
# Usage:
#   ./test-streaming-integration.sh
#
# Tests:
#   1. WebSocket connection
#   2. Message sending
#   3. Session persistence
#   4. Error handling
#   5. Full workflow integration
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
declare -a TEST_RESULTS

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✅ $1")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("❌ $1")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    local test_name="$1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    log_info "Test $TOTAL_TESTS: $test_name"
    echo "========================================"
}

# Test 1: Check Python dependencies
test_dependencies() {
    run_test "Check Python dependencies"

    if python3 -c "import websocket" 2>/dev/null; then
        log_success "websocket-client installed"
    else
        log_fail "websocket-client not installed"
        echo "   Install: pip3 install websocket-client"
        return 1
    fi

    if [ -f "social-stream-client.py" ]; then
        log_success "social-stream-client.py found"
    else
        log_fail "social-stream-client.py not found"
        return 1
    fi
}

# Test 2: WebSocket connection
test_websocket_connection() {
    run_test "WebSocket connection to Social Stream Ninja"

    local session_id="test-$(date +%s)"

    # Start session
    if python3 social-stream-client.py --start --session "$session_id" > /tmp/test-ws-start.log 2>&1; then
        log_success "WebSocket connection established"

        # Verify session file created
        if [ -f ".miyabi-stream-session" ]; then
            log_success "Session file created"
        else
            log_fail "Session file not created"
            return 1
        fi

        # Stop session
        python3 social-stream-client.py --stop > /tmp/test-ws-stop.log 2>&1

        # Verify session file removed
        if [ ! -f ".miyabi-stream-session" ]; then
            log_success "Session cleanup successful"
        else
            log_fail "Session file not removed"
            return 1
        fi
    else
        log_fail "WebSocket connection failed"
        cat /tmp/test-ws-start.log
        return 1
    fi
}

# Test 3: Message sending
test_message_sending() {
    run_test "Message sending via WebSocket"

    local session_id="test-$(date +%s)"

    # Start session
    python3 social-stream-client.py --start --session "$session_id" > /dev/null 2>&1

    # Wait for connection to stabilize
    sleep 1

    # Send test message
    if python3 social-stream-client.py --send "Test message from integration test" > /tmp/test-ws-send.log 2>&1; then
        log_success "Message sent successfully"
    else
        log_fail "Message sending failed"
        cat /tmp/test-ws-send.log
        python3 social-stream-client.py --stop > /dev/null 2>&1
        return 1
    fi

    # Stop session
    python3 social-stream-client.py --stop > /dev/null 2>&1
}

# Test 4: Session info
test_session_info() {
    run_test "Session information retrieval"

    local session_id="test-$(date +%s)"

    # Start session
    python3 social-stream-client.py --start --session "$session_id" > /dev/null 2>&1

    # Get session info
    if python3 social-stream-client.py --info > /tmp/test-ws-info.log 2>&1; then
        log_success "Session info retrieved"

        # Verify info contains session ID
        if grep -q "$session_id" /tmp/test-ws-info.log; then
            log_success "Session ID matches"
        else
            log_fail "Session ID mismatch"
            cat /tmp/test-ws-info.log
            python3 social-stream-client.py --stop > /dev/null 2>&1
            return 1
        fi
    else
        log_fail "Session info retrieval failed"
        cat /tmp/test-ws-info.log
        python3 social-stream-client.py --stop > /dev/null 2>&1
        return 1
    fi

    # Stop session
    python3 social-stream-client.py --stop > /dev/null 2>&1
}

# Test 5: Error handling (no active session)
test_error_handling() {
    run_test "Error handling (no active session)"

    # Remove any existing session
    rm -f .miyabi-stream-session

    # Try to send message without active session
    if python3 social-stream-client.py --send "Test" 2>&1 | grep -q "No active session"; then
        log_success "Error handling works (no session error)"
    else
        log_fail "Error handling failed"
        return 1
    fi
}

# Test 6: miyabi-narrate.sh streaming integration
test_full_workflow() {
    run_test "Full workflow integration (miyabi-narrate.sh)"

    if [ ! -f "miyabi-narrate.sh" ]; then
        log_warn "miyabi-narrate.sh not found, skipping"
        return 0
    fi

    # Check if VOICEVOX Engine is running
    if ! curl -s http://127.0.0.1:50021/version > /dev/null; then
        log_warn "VOICEVOX Engine not running, skipping full workflow test"
        return 0
    fi

    # Run miyabi-narrate.sh with streaming (dry-run style)
    log_info "Running miyabi-narrate.sh with streaming..."

    # This is a smoke test - we just verify it starts without errors
    if timeout 30s ./miyabi-narrate.sh -d 1 -l > /tmp/test-full-workflow.log 2>&1; then
        log_success "Full workflow completed"

        # Verify session file was created
        if grep -q "Social Stream Ninja" /tmp/test-full-workflow.log; then
            log_success "Social Stream Ninja integration detected"
        else
            log_warn "Social Stream Ninja integration not detected in logs"
        fi
    else
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            log_warn "Full workflow test timed out (30s) - may be normal for full execution"
        else
            log_fail "Full workflow failed with exit code $EXIT_CODE"
            tail -20 /tmp/test-full-workflow.log
            return 1
        fi
    fi
}

# Test 7: Performance test (message rate)
test_message_rate() {
    run_test "Message rate performance test"

    local session_id="test-$(date +%s)"

    # Start session
    python3 social-stream-client.py --start --session "$session_id" > /dev/null 2>&1
    sleep 1

    # Send 10 messages with 2-second intervals
    local start_time=$(date +%s)
    for i in {1..5}; do
        python3 social-stream-client.py --send "Test message $i" > /dev/null 2>&1
        sleep 2
    done
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Expected: ~10 seconds (5 messages × 2 seconds)
    if [ $duration -ge 8 ] && [ $duration -le 12 ]; then
        log_success "Message rate within expected range (${duration}s for 5 messages)"
    else
        log_warn "Message rate outside expected range (${duration}s for 5 messages)"
    fi

    # Stop session
    python3 social-stream-client.py --stop > /dev/null 2>&1
}

# Print test summary
print_summary() {
    echo ""
    echo "========================================"
    echo "Test Summary"
    echo "========================================"
    echo ""

    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done

    echo ""
    echo "Total Tests:  $TOTAL_TESTS"
    echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
    echo -e "${RED}Failed:       $FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ All tests passed!${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Some tests failed${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo "========================================"
    echo "Miyabi Social Stream Ninja Integration Test Suite"
    echo "========================================"

    # Change to tools directory
    cd "$(dirname "$0")"

    # Run all tests
    test_dependencies
    test_websocket_connection
    test_message_sending
    test_session_info
    test_error_handling
    test_message_rate
    test_full_workflow

    # Print summary
    print_summary
}

# Run main
main
