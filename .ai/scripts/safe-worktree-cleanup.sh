#!/bin/bash
# safe-worktree-cleanup.sh
# Safe worktree cleanup script for Issue #812
# Generated: 2025-11-12

set -e

echo "=========================================="
echo "Miyabi Worktree Safe Cleanup"
echo "Issue #812"
echo "=========================================="
echo ""

# Change to repository root
cd /Users/shunsuke/Dev/miyabi-private

echo "Current worktrees:"
git worktree list
echo ""

# Safe candidates (no uncommitted changes, no active work)
safe_worktrees=(
  "codex-pr-review"
  "log-comment"
  "phase1-18-codex-setup"
  "root-dir-cleanup"
)

echo "The following worktrees will be removed:"
for wt in "${safe_worktrees[@]}"; do
  echo "  - .worktrees/$wt"
done
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Removing safe worktrees..."

for wt in "${safe_worktrees[@]}"; do
  if [ -d ".worktrees/$wt" ]; then
    echo "Removing .worktrees/$wt..."
    git worktree remove ".worktrees/$wt" --force
    echo "  ✓ Removed"
  else
    echo "  ⚠ .worktrees/$wt not found, skipping"
  fi
done

echo ""
echo "Checking miyabi-orchestra (locked)..."
if [ -d ".worktrees/miyabi-orchestra" ]; then
  echo "Unlocking miyabi-orchestra..."
  git worktree unlock .worktrees/miyabi-orchestra || true
  echo "  ✓ Unlocked"
  echo "  → Manual review recommended before removal"
fi

echo ""
echo "=========================================="
echo "Safe cleanup complete!"
echo "=========================================="
echo ""
echo "Current worktrees:"
git worktree list
echo ""
echo "Next steps:"
echo "  1. Review .worktrees/miyabi-orchestra and remove if not needed"
echo "  2. Run clean-worktree-builds.sh to clean build artifacts"
echo "  3. Review worktrees with uncommitted changes"
