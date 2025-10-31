#!/usr/bin/env bash
#
# CI/CD Health Check
# Purpose: Monitor CI/CD pipeline health
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🔍 Checking CI/CD health..."

# Check if GITHUB_TOKEN is set
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "❌ GITHUB_TOKEN not set. Skipping CI health check."
    exit 0
fi

# Get repository from git remote
REPO_URL=$(git config --get remote.origin.url)
REPO_NAME=$(echo "$REPO_URL" | sed -e 's/.*github.com[:/]\(.*\)\.git$/\1/')

echo "   Repository: $REPO_NAME"

# Check recent workflow runs
RECENT_RUNS=$(gh run list --repo "$REPO_NAME" --limit 10 --json status,conclusion,name,displayTitle | \
    jq -r '.[] | "\(.status)|\(.conclusion)|\(.name)"')

failed_count=0
in_progress_count=0

while IFS='|' read -r status conclusion name; do
    if [ "$status" == "in_progress" ]; then
        in_progress_count=$((in_progress_count + 1))
    elif [ "$conclusion" == "failure" ]; then
        failed_count=$((failed_count + 1))
    fi
done <<< "$RECENT_RUNS"

echo "   Recent runs: 10"
echo "   In progress: $in_progress_count"
echo "   Failed: $failed_count"

if [ $failed_count -gt 3 ]; then
    echo "⚠️  WARNING: High failure rate detected ($failed_count/10)"
    # Could send notification here
else
    echo "✅ CI health check passed"
fi
