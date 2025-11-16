#!/usr/bin/env bash
set -euo pipefail

echo "🎭 Miyabi Full Operation Test"
echo "=============================="
echo ""

PASSED=0
FAILED=0

test_component() {
  local name="$1"
  local cmd="$2"
  
  echo -n "Testing ${name}... "
  if eval "$cmd" &>/dev/null; then
    echo "✅ PASS"
    ((PASSED++))
  else
    echo "❌ FAIL"
    ((FAILED++))
  fi
}

# Core tests
test_component "Git repo" "cd ~/miyabi-private && git status"
test_component "Main branch" "cd ~/miyabi-private && git branch | grep -q main"
test_component "Scripts dir" "test -d ~/.claude/scripts"
test_component "Commands dir" "test -d ~/.claude/commands"

# Command tests
for cmd in issue-create dashboard worktree-list pr-list; do
  test_component "/${cmd}" "test -f ~/.claude/commands/${cmd}.md"
done

# Script tests  
for script in check-env.sh check-ssh.sh init-miyabi.sh; do
  test_component "${script}" "test -x ~/.claude/scripts/${script}"
done

echo ""
echo "=============================="
echo "Results: ${PASSED} passed, ${FAILED} failed"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed! Miyabi is fully operational 🚀"
  exit 0
else
  echo "⚠️  Some tests failed - please review"
  exit 1
fi
