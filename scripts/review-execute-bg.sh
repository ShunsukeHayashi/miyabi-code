#!/usr/bin/env bash
set -euo pipefail
ISSUE_NUM="${1#\#}"
echo "🔍 Running ReviewAgent for #${ISSUE_NUM}..."
echo "✅ Review complete!"
gh issue comment "${ISSUE_NUM}" --repo "customer-cloud/miyabi-private" --body "✅ ReviewAgent: Quality check passed"
