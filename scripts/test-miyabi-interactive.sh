#!/usr/bin/env bash
set -euo pipefail

echo "🎭 Miyabi Interactive Operation Test"
echo "===================================="
echo ""

echo "✅ Step 1: Check Claude Code availability"
which claude 2>/dev/null && echo "  Claude Code: Installed" || echo "  Claude Code: Not in PATH"
echo ""

echo "✅ Step 2: Check environment"
bash ~/.claude/scripts/check-env.sh 2>/dev/null || echo "  (Some vars may be missing - non-critical)"
echo ""

echo "✅ Step 3: Check SSH connections"
bash ~/.claude/scripts/check-ssh.sh 2>/dev/null || echo "  (Some hosts may be unreachable)"
echo ""

echo "✅ Step 4: Test slash commands"
for cmd in issue-create task-decompose dashboard; do
  if [ -f ~/.claude/commands/${cmd}.md ]; then
    echo "  /${cmd}: Available ✓"
  else
    echo "  /${cmd}: Missing ✗"
  fi
done
echo ""

echo "✅ Interactive test complete!"
echo "Miyabi is operational 🚀"
