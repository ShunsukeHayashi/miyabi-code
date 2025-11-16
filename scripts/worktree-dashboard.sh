#!/usr/bin/env bash
echo "📊 Worktree Management Dashboard"
echo "=================================="
cd ~/miyabi-private
echo ""
echo "Active Worktrees:"
git worktree list | nl
echo ""
echo "Disk Usage:"
du -sh ~/miyabi-pr-worker-* 2>/dev/null | sort -h || echo "No workers found"
