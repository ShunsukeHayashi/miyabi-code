#!/bin/bash
set -e

echo "🧪 Headless Mode Manual Test"

# Worktree作成
git worktree add .worktrees/test-headless

# Headless実行
claude code --headless \
  --execute-command "echo 'Headless test successful'" \
  --cwd .worktrees/test-headless \
  --no-human-in-loop

# Cleanup
git worktree remove .worktrees/test-headless

echo "✅ Test completed"
