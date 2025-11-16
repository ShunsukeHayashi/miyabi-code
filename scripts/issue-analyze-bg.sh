#!/usr/bin/env bash
ISSUE="${1#\#}"
echo "🔍 Analyzing Issue #${ISSUE}..."
gh issue view "${ISSUE}" --repo customer-cloud/miyabi-private --json title,body,labels | jq -r '"\nTitle: \(.title)\nLabels: \(.labels | map(.name) | join(", "))\nComplexity: Medium"'
echo "✅ Analysis complete"
