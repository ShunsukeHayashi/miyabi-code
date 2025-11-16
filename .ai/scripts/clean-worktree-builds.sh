#!/bin/bash
# clean-worktree-builds.sh
# Clean build artifacts from all worktrees
# Generated: 2025-11-12

set -e

echo "=========================================="
echo "Miyabi Worktree Build Cleanup"
echo "Issue #812"
echo "=========================================="
echo ""

# Change to repository root
cd /Users/shunsuke/Dev/miyabi-private

echo "This will run 'cargo clean' in all worktrees."
echo "Build artifacts will be removed but source code unchanged."
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Cleaning build artifacts in all worktrees..."
echo ""

# Clean main worktree
echo "Cleaning main worktree..."
cargo clean
echo "  ✓ Done"
echo ""

# Clean all worktrees
for wt in .worktrees/*/; do
  if [ -d "$wt" ]; then
    wt_name=$(basename "$wt")
    echo "Cleaning $wt_name..."
    (cd "$wt" && cargo clean 2>/dev/null) || echo "  ⚠ No Cargo.toml, skipping"
    echo "  ✓ Done"
  fi
done

echo ""
echo "=========================================="
echo "Build cleanup complete!"
echo "=========================================="
echo ""
echo "Disk space freed. Re-run worktree status to see actual code changes."
echo ""
echo "Next: Run worktree-status.sh to see updated change counts"
