#!/usr/bin/env bash
#
# GitHub Issue Triage
# Purpose: Auto-triage unlabeled issues using label inference
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🔍 Triaging unlabeled GitHub Issues..."

# Check if GITHUB_TOKEN is set
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "❌ GITHUB_TOKEN not set. Skipping issue triage."
    exit 0
fi

# Get repository from git remote
REPO_URL=$(git config --get remote.origin.url)
REPO_NAME=$(echo "$REPO_URL" | sed -e 's/.*github.com[:/]\(.*\)\.git$/\1/')

echo "   Repository: $REPO_NAME"

# Get unlabeled issues
UNLABELED_ISSUES=$(gh issue list --repo "$REPO_NAME" --label "unlabeled" --limit 10 --json number,title | jq -r '.[] | "\(.number)|\(.title)"')

if [ -z "$UNLABELED_ISSUES" ]; then
    echo "✅ No unlabeled issues found"
    exit 0
fi

# Process each issue
echo "$UNLABELED_ISSUES" | while IFS='|' read -r issue_number issue_title; do
    echo "  Processing Issue #${issue_number}: $issue_title"

    # Use miyabi-cli to infer labels (if available)
    if [ -f "$PROJECT_ROOT/target/release/miyabi" ]; then
        "$PROJECT_ROOT/target/release/miyabi" issue analyze --issue "$issue_number" --auto-label 2>&1 || true
    else
        echo "    ⚠️  miyabi-cli not found. Skipping label inference."
    fi
done

echo "✅ Issue triage complete"
