#!/bin/bash
# worktree-status.sh
# Generate detailed worktree status report
# Generated: 2025-11-12

set -e

echo "=========================================="
echo "Miyabi Worktree Status Report"
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# Change to repository root
cd /Users/shunsuke/Dev/miyabi-private

git worktree list | while IFS= read -r line; do
  # Parse worktree list output
  path=$(echo "$line" | awk '{print $1}')
  commit=$(echo "$line" | awk '{print $2}')
  branch=$(echo "$line" | awk '{$1=$2=""; print $0}' | sed 's/^ *//')

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Path: $path"
  echo "Branch: $branch"
  echo "Commit: $commit"

  if [ -d "$path" ]; then
    (cd "$path" && \
      echo "Last commit: $(git log -1 --format='%cd | %s' --date=short 2>/dev/null || echo 'N/A')" && \
      total_changes=$(git status --short 2>/dev/null | wc -l | xargs) && \
      real_changes=$(git status --short 2>/dev/null | grep -v 'target/' | grep -v '\.worktrees/' | wc -l | xargs) && \
      echo "Changed files: $total_changes (total), $real_changes (excluding build artifacts)")

    # Check for remote branch
    (cd "$path" && \
      remote_branch=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "none") && \
      echo "Remote: $remote_branch")

    # Show first few actual changes (excluding target/)
    (cd "$path" && \
      changes=$(git status --short 2>/dev/null | grep -v 'target/' | grep -v '\.worktrees/' | head -5) && \
      if [ -n "$changes" ]; then
        echo "Sample changes:" && \
        echo "$changes" | sed 's/^/  /'
      fi)
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
total_worktrees=$(git worktree list | tail -n +2 | wc -l | xargs)
echo "  Total worktrees: $total_worktrees"
echo ""
echo "For detailed analysis, see:"
echo "  .ai/reports/worktree-cleanup-$(date +%Y%m%d).md"
