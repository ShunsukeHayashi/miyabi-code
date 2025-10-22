#!/bin/bash

#############################################################################
# Miyabi Daily Update - Git Information Collector
#
# Purpose: Collect today's Git activity for daily progress report generation
# Used by: /daily-update Claude Code slash command
# Author: Claude Code (AI Assistant)
#############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
OUTPUT_FORMAT="${2:-json}" # json or markdown
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo -e "${BLUE}📊 Collecting Git information for ${TARGET_DATE}${NC}"

# Get start and end timestamps for the target date
START_TIME="${TARGET_DATE} 00:00:00"
END_TIME="${TARGET_DATE} 23:59:59"

#############################################################################
# 1. Commit Information
#############################################################################

echo -e "${YELLOW}🔍 Analyzing commits...${NC}"

# Get commit count
COMMIT_COUNT=$(git log --since="$START_TIME" --until="$END_TIME" --no-merges --oneline | wc -l | tr -d ' ')

# Get commit list
COMMITS=$(git log --since="$START_TIME" --until="$END_TIME" --no-merges \
  --pretty=format:'{"hash": "%h", "message": "%s", "author": "%an", "time": "%ai"}' | \
  jq -s '.')

# If no commits found, set empty array
if [ -z "$COMMITS" ] || [ "$COMMITS" = "null" ]; then
  COMMITS="[]"
fi

echo -e "${GREEN}  ✅ Found ${COMMIT_COUNT} commits${NC}"

#############################################################################
# 2. File Change Statistics
#############################################################################

echo -e "${YELLOW}🔍 Analyzing file changes...${NC}"

# Get first commit hash of the day
FIRST_COMMIT=$(git log --since="$START_TIME" --until="$END_TIME" --no-merges --format="%H" | tail -1)

if [ -n "$FIRST_COMMIT" ]; then
  # Get stats: files changed, insertions, deletions
  STATS=$(git diff --shortstat "${FIRST_COMMIT}^" HEAD 2>/dev/null || echo "0 files changed, 0 insertions(+), 0 deletions(-)")

  FILES_CHANGED=$(echo "$STATS" | grep -oE '[0-9]+ file' | grep -oE '[0-9]+' || echo "0")
  ADDITIONS=$(echo "$STATS" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
  DELETIONS=$(echo "$STATS" | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
else
  FILES_CHANGED=0
  ADDITIONS=0
  DELETIONS=0
fi

echo -e "${GREEN}  ✅ ${FILES_CHANGED} files changed (+${ADDITIONS}, -${DELETIONS})${NC}"

#############################################################################
# 3. Issue Information
#############################################################################

echo -e "${YELLOW}🔍 Extracting Issue references...${NC}"

# Extract issue numbers from commit messages
ISSUE_REFS=$(git log --since="$START_TIME" --until="$END_TIME" --no-merges --pretty=format:"%s" | \
  grep -oE '#[0-9]+' | sort -u || echo "")

# Create issue array using proper JSON construction
ISSUES_TMP=()
if [ -n "$ISSUE_REFS" ]; then
  while IFS= read -r issue_ref; do
    if [ -n "$issue_ref" ]; then
      issue_num="${issue_ref#\#}"
      # Try to get issue title from GitHub (requires gh CLI)
      if command -v gh &> /dev/null; then
        issue_title=$(gh issue view "$issue_num" --json title --jq '.title' 2>/dev/null || echo "Unknown")
      else
        issue_title="Unknown"
      fi
      # Build JSON object properly with jq
      issue_json=$(jq -n \
        --arg num "$issue_num" \
        --arg title "$issue_title" \
        '{number: ($num | tonumber), title: $title}')
      ISSUES_TMP+=("$issue_json")
    fi
  done <<< "$ISSUE_REFS"
fi

# Combine into JSON array
if [ ${#ISSUES_TMP[@]} -gt 0 ]; then
  ISSUES=$(printf '%s\n' "${ISSUES_TMP[@]}" | jq -s '.')
else
  ISSUES="[]"
fi

ISSUE_COUNT=$(echo "$ISSUES" | jq 'length')
echo -e "${GREEN}  ✅ Found ${ISSUE_COUNT} issue references${NC}"

#############################################################################
# 4. Pull Request Information
#############################################################################

echo -e "${YELLOW}🔍 Checking Pull Requests...${NC}"

PRS="[]"
PR_COUNT=0
if command -v gh &> /dev/null; then
  # Get PRs created today
  PRS=$(gh pr list --search "created:$TARGET_DATE" --json number,title,url --limit 100 2>/dev/null || echo "[]")
  PR_COUNT=$(echo "$PRS" | jq 'length')
  echo -e "${GREEN}  ✅ Found ${PR_COUNT} PRs created today${NC}"
else
  echo -e "${YELLOW}  ⚠️  gh CLI not found, skipping PR collection${NC}"
fi

#############################################################################
# 5. Changed Files List
#############################################################################

echo -e "${YELLOW}🔍 Listing changed files...${NC}"

CHANGED_FILES="[]"
if [ -n "$FIRST_COMMIT" ]; then
  CHANGED_FILES=$(git diff --name-status "${FIRST_COMMIT}^" HEAD 2>/dev/null | \
    awk '{printf "{\"status\": \"%s\", \"file\": \"%s\"},\n", $1, $2}' | \
    sed '$ s/,$//' | \
    jq -s '.' || echo "[]")
fi

CHANGED_FILES_COUNT=$(echo "$CHANGED_FILES" | jq 'length')
echo -e "${GREEN}  ✅ ${CHANGED_FILES_COUNT} files tracked${NC}"

#############################################################################
# 6. Generate Highlights (from commit messages)
#############################################################################

echo -e "${YELLOW}🔍 Extracting highlights...${NC}"

# Extract highlights from commit messages
# - Look for feat:, fix:, docs:, etc.
# - Group by type
HIGHLIGHTS=$(git log --since="$START_TIME" --until="$END_TIME" --no-merges \
  --pretty=format:'%s' | \
  grep -E '^(feat|fix|docs|style|refactor|perf|test|chore):' | \
  sed -E 's/^(feat|fix|docs|style|refactor|perf|test|chore):\s*//' | \
  head -5 | \
  jq -R -s 'split("\n")[:-1]' || echo "[]")

HIGHLIGHTS_COUNT=$(echo "$HIGHLIGHTS" | jq 'length')
echo -e "${GREEN}  ✅ ${HIGHLIGHTS_COUNT} highlights extracted${NC}"

#############################################################################
# 7. Assemble JSON Output
#############################################################################

JSON_OUTPUT=$(cat <<EOF
{
  "date": "$TARGET_DATE",
  "summary": {
    "commits": $COMMIT_COUNT,
    "filesChanged": $FILES_CHANGED,
    "additions": $ADDITIONS,
    "deletions": $DELETIONS,
    "issuesProcessed": $ISSUE_COUNT,
    "prsCreated": $PR_COUNT
  },
  "commits": $COMMITS,
  "issues": $ISSUES,
  "prs": $PRS,
  "changedFiles": $CHANGED_FILES,
  "highlights": $HIGHLIGHTS,
  "nextSteps": [],
  "metadata": {
    "collectedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "repository": "$(git remote get-url origin 2>/dev/null || echo 'unknown')",
    "branch": "$(git branch --show-current)"
  }
}
EOF
)

#############################################################################
# 8. Output
#############################################################################

if [ "$OUTPUT_FORMAT" = "json" ]; then
  echo "$JSON_OUTPUT" | jq '.'
elif [ "$OUTPUT_FORMAT" = "markdown" ]; then
  # Generate markdown summary
  cat <<EOF

# Git Activity Report - $TARGET_DATE

## 📊 Summary

| Metric | Value |
|--------|-------|
| Commits | $COMMIT_COUNT |
| Files Changed | $FILES_CHANGED |
| Lines Added | +$ADDITIONS |
| Lines Deleted | -$DELETIONS |
| Issues Processed | $ISSUE_COUNT |
| PRs Created | $PR_COUNT |

## 🎯 Highlights

$(echo "$HIGHLIGHTS" | jq -r '.[] | "- " + .')

## 📝 Commits

$(echo "$COMMITS" | jq -r '.[] | "- `\(.hash)` \(.message)"')

## 🐛 Issues

$(echo "$ISSUES" | jq -r '.[] | "- #\(.number): \(.title)"')

## 🔀 Pull Requests

$(echo "$PRS" | jq -r '.[] | "- #\(.number): \(.title)"')

## 📂 Changed Files

$(echo "$CHANGED_FILES" | jq -r '.[] | "- [\(.status)] \(.file)"')

---

*Generated by Miyabi Daily Update System*
*Repository: $(git remote get-url origin 2>/dev/null || echo 'unknown')*
*Branch: $(git branch --show-current)*

EOF
fi

echo -e "\n${GREEN}✅ Git information collection completed!${NC}"

# Save to temp file for later use
TMP_FILE="/tmp/miyabi-daily-git-info-${TARGET_DATE}.json"
echo "$JSON_OUTPUT" | jq '.' > "$TMP_FILE"
echo -e "${BLUE}💾 Saved to: ${TMP_FILE}${NC}"
