#!/usr/bin/env bash
WORKTREE="${1}"
echo "🗑️ Removing worktree: ${WORKTREE}..."
cd ~/miyabi-private && git worktree remove "${WORKTREE}" 2>/dev/null || echo "Worktree not found"
echo "✅ Cleanup complete"
