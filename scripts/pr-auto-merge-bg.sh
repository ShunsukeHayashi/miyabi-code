#!/usr/bin/env bash
PR="${1#\#}"
echo "🤖 Auto-merging PR #${PR}..."
gh pr merge "${PR}" --repo customer-cloud/miyabi-private --squash --auto
echo "✅ Auto-merge enabled"
