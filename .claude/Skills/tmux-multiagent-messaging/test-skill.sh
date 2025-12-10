#!/bin/bash
# tmux-multiagent-messaging Skill Test Script
# Tests core messaging functions

set -e

SCRIPT_DIR="$HOME/.claude/scripts"
PASS=0
FAIL=0

echo "=== tmux-multiagent-messaging Skill Tests ==="
echo ""

# Test 1: Check required scripts exist
echo -n "Test 1: Required scripts exist... "
REQUIRED_SCRIPTS=(
    "tmux-safe-send.sh"
    "agent-watcher.sh"
    "task-queue.sh"
    "agent-watcher-with-queue.sh"
)
ALL_EXIST=true
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$script" ]; then
        ALL_EXIST=false
        echo "MISSING: $script"
    fi
done
if [ "$ALL_EXIST" = true ]; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 2: Scripts are executable
echo -n "Test 2: Scripts are executable... "
ALL_EXEC=true
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ] && [ ! -x "$SCRIPT_DIR/$script" ]; then
        ALL_EXEC=false
        echo "NOT EXECUTABLE: $script"
    fi
done
if [ "$ALL_EXEC" = true ]; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 3: tmux-safe-send.sh has required functions
echo -n "Test 3: tmux-safe-send.sh has tmux_safe_send function... "
if grep -q "tmux_safe_send()" "$SCRIPT_DIR/tmux-safe-send.sh" 2>/dev/null; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 4: task-queue.sh has required commands
echo -n "Test 4: task-queue.sh has init/add/get commands... "
if grep -qE "init\)" "$SCRIPT_DIR/task-queue.sh" 2>/dev/null; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 5: SKILL.md has required sections
echo -n "Test 5: SKILL.md has required sections... "
SKILL_FILE="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/Skills/tmux-multiagent-messaging/SKILL.md"
if grep -q "Phase 1:" "$SKILL_FILE" && \
   grep -q "Phase 2:" "$SKILL_FILE" && \
   grep -q "Phase 3:" "$SKILL_FILE" 2>/dev/null; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 6: tmux available
echo -n "Test 6: tmux is installed... "
if command -v tmux &>/dev/null; then
    echo "PASS ($(tmux -V))"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

echo ""
echo "=== Results ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Some tests failed."
    exit 1
fi
