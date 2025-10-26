#!/bin/bash
# Primitive Script: Git Safety Check
# Purpose: Verify git repository is in safe state for automation
# Usage: ./git-safety-check.sh
# Exit codes:
#   0 = Safe to proceed
#   1 = Unsafe state detected

set -e

echo "====================================="
echo "Git Safety Check"
echo "====================================="

# Check 1: No uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "❌ UNSAFE: Uncommitted changes detected"
    echo ""
    echo "Modified files:"
    git status --short
    exit 1
fi

# Check 2: No untracked files (except allowed patterns)
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    # Filter out allowed patterns
    FILTERED=$(echo "$UNTRACKED" | grep -v -E '(^tmp/|^\.DS_Store|^logs/)')

    if [ -n "$FILTERED" ]; then
        echo "⚠️  WARNING: Untracked files detected"
        echo ""
        echo "$FILTERED" | sed 's/^/  - /'
        echo ""
        echo "These files will not be included in automation"
    fi
fi

# Check 3: Not in detached HEAD
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [ -z "$BRANCH" ]; then
    echo "❌ UNSAFE: Detached HEAD state"
    exit 1
fi

# Check 4: Not on main/master (unless explicitly allowed)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    if [ "${ALLOW_MAIN:-false}" != "true" ]; then
        echo "❌ UNSAFE: Currently on $BRANCH branch"
        echo "Automation on main/master is disabled by default"
        echo "Set ALLOW_MAIN=true to override"
        exit 1
    fi
fi

# Check 5: Remote is up to date
if git remote get-url origin &>/dev/null; then
    git fetch origin "$BRANCH" --quiet 2>/dev/null || true

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "$LOCAL")

    if [ "$LOCAL" != "$REMOTE" ]; then
        AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo "0")
        BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo "0")

        if [ "$BEHIND" -gt 0 ]; then
            echo "⚠️  WARNING: Branch is $BEHIND commits behind origin/$BRANCH"
            echo "Consider pulling latest changes"
        fi

        if [ "$AHEAD" -gt 0 ]; then
            echo "ℹ️  INFO: Branch is $AHEAD commits ahead of origin/$BRANCH"
        fi
    fi
fi

echo "✅ Git repository is in safe state"
echo "Branch: $BRANCH"
echo "Commit: $(git rev-parse --short HEAD)"
echo ""

exit 0
