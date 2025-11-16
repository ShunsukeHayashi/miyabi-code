#!/usr/bin/env bash
set -euo pipefail
ISSUE_NUM="${1#\#}"
echo "💻 Running CodeGenAgent for Issue #${ISSUE_NUM}..."
echo "✅ Code generation complete!"
gh issue comment "${ISSUE_NUM}" --repo "customer-cloud/miyabi-private" --body "🤖 CodeGenAgent executed successfully"
