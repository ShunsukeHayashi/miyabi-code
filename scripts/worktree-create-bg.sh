#!/usr/bin/env bash
set -euo pipefail
ISSUE_NUM="${1#\#}"
BASE_BRANCH="${2:-main}"
WORKTREE_DIR="${HOME}/miyabi-worktree-${ISSUE_NUM}"
BRANCH_NAME="feat/issue-${ISSUE_NUM}"

echo "🌳 Creating worktree for Issue #${ISSUE_NUM}..."
cd ~/miyabi-private
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" "${BASE_BRANCH}"
echo "✅ Worktree created: ${WORKTREE_DIR}"
echo "📁 Branch: ${BRANCH_NAME}"
