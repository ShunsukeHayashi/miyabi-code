#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Cleaning up stale worktrees..."
cd ~/miyabi-private

echo "Current worktrees:"
git worktree list

echo ""
echo "Checking for merged branches..."

# Get list of worktrees
git worktree list --porcelain | grep "worktree " | cut -d' ' -f2 | while read -r worktree; do
  if [ "$worktree" = "$(pwd)" ]; then
    continue
  fi
  
  BRANCH=$(git -C "$worktree" branch --show-current 2>/dev/null || echo "DETACHED")
  
  if [ "$BRANCH" = "DETACHED" ] || [ -z "$BRANCH" ]; then
    echo "❌ Detached HEAD in $worktree - needs manual review"
    continue
  fi
  
  # Check if branch is merged to main
  if git branch --merged main | grep -q "^\s*$BRANCH$"; then
    echo "✅ Branch $BRANCH is merged - safe to remove"
    echo "   Run: git worktree remove $worktree"
  else
    echo "⚠️  Branch $BRANCH not merged yet"
  fi
done

echo ""
echo "✅ Cleanup analysis complete!"
