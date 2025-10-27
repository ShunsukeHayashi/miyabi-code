#!/bin/bash
# Performance Measurement Script for Miyabi Autonomous Workflow
# Version: 1.0.0
# Description: Measures Issue → PR merge time and reports performance metrics

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 <issue_number>"
    echo "Example: $0 123"
    exit 1
fi

ISSUE_NUMBER=$1
REPO="customer-cloud/miyabi-private"

echo -e "${BLUE}📊 Miyabi Autonomous Workflow - Performance Measurement${NC}"
echo "======================================================"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) is not installed${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub CLI${NC}"
    exit 1
fi

echo -e "${CYAN}Issue: #$ISSUE_NUMBER${NC}"
echo -e "${CYAN}Repository: $REPO${NC}"
echo ""

# Get Issue details
echo "🔍 Fetching Issue data..."
ISSUE_DATA=$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json number,title,createdAt,closedAt,state,labels,url)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to fetch Issue #$ISSUE_NUMBER${NC}"
    exit 1
fi

ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
ISSUE_STATE=$(echo "$ISSUE_DATA" | jq -r '.state')
ISSUE_CREATED=$(echo "$ISSUE_DATA" | jq -r '.createdAt')
ISSUE_CLOSED=$(echo "$ISSUE_DATA" | jq -r '.closedAt')
ISSUE_URL=$(echo "$ISSUE_DATA" | jq -r '.url')

echo -e "${GREEN}✅ Issue Title:${NC} $ISSUE_TITLE"
echo -e "${GREEN}✅ State:${NC} $ISSUE_STATE"
echo -e "${GREEN}✅ Created:${NC} $ISSUE_CREATED"
echo ""

# Find associated PR
echo "🔍 Searching for associated PR..."
PR_DATA=$(gh pr list --repo "$REPO" --state all --search "$ISSUE_NUMBER" --json number,title,createdAt,mergedAt,state,url --limit 1)

if [ "$(echo "$PR_DATA" | jq length)" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No PR found yet for Issue #$ISSUE_NUMBER${NC}"
    echo ""
    echo "Workflow may still be in progress. Check:"
    echo "  - Issue comments: gh issue view $ISSUE_NUMBER --comments"
    echo "  - Open PRs: gh pr list --state open"
    exit 0
fi

PR_NUMBER=$(echo "$PR_DATA" | jq -r '.[0].number')
PR_TITLE=$(echo "$PR_DATA" | jq -r '.[0].title')
PR_STATE=$(echo "$PR_DATA" | jq -r '.[0].state')
PR_CREATED=$(echo "$PR_DATA" | jq -r '.[0].createdAt')
PR_MERGED=$(echo "$PR_DATA" | jq -r '.[0].mergedAt')
PR_URL=$(echo "$PR_DATA" | jq -r '.[0].url')

echo -e "${GREEN}✅ PR #$PR_NUMBER:${NC} $PR_TITLE"
echo -e "${GREEN}✅ PR State:${NC} $PR_STATE"
echo -e "${GREEN}✅ PR Created:${NC} $PR_CREATED"

if [ "$PR_MERGED" != "null" ]; then
    echo -e "${GREEN}✅ PR Merged:${NC} $PR_MERGED"
else
    echo -e "${YELLOW}⚠️  PR not merged yet${NC}"
fi

echo ""

# Calculate timeline
if [ "$PR_MERGED" != "null" ]; then
    echo "======================================================"
    echo -e "${BLUE}⏱️  Performance Metrics${NC}"
    echo "======================================================"
    echo ""

    # Convert ISO timestamps to seconds
    ISSUE_CREATED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$ISSUE_CREATED" +%s 2>/dev/null || date -d "$ISSUE_CREATED" +%s)
    PR_CREATED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$PR_CREATED" +%s 2>/dev/null || date -d "$PR_CREATED" +%s)
    PR_MERGED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$PR_MERGED" +%s 2>/dev/null || date -d "$PR_MERGED" +%s)

    # Calculate durations
    PHASE_1_6_DURATION=$((PR_CREATED_SEC - ISSUE_CREATED_SEC))
    PHASE_7_9_DURATION=$((PR_MERGED_SEC - PR_CREATED_SEC))
    TOTAL_DURATION=$((PR_MERGED_SEC - ISSUE_CREATED_SEC))

    # Convert to minutes
    PHASE_1_6_MIN=$((PHASE_1_6_DURATION / 60))
    PHASE_7_9_MIN=$((PHASE_7_9_DURATION / 60))
    TOTAL_MIN=$((TOTAL_DURATION / 60))

    # Display results
    echo -e "${CYAN}📍 Issue Created:${NC}     $ISSUE_CREATED"
    echo -e "${CYAN}📍 PR Created:${NC}        $PR_CREATED"
    echo -e "${CYAN}📍 PR Merged:${NC}         $PR_MERGED"
    echo ""

    echo -e "${YELLOW}⏱️  Phase 1-6 Duration:${NC}  ${PHASE_1_6_MIN} min (${PHASE_1_6_DURATION}s)"
    echo -e "${YELLOW}⏱️  Phase 7-9 Duration:${NC}  ${PHASE_7_9_MIN} min (${PHASE_7_9_DURATION}s)"
    echo ""

    # Total duration with color coding
    TARGET_SEC=$((45 * 60)) # 45 minutes target

    if [ $TOTAL_DURATION -le $TARGET_SEC ]; then
        echo -e "${GREEN}✅ Total Duration:${NC}      ${TOTAL_MIN} min (${TOTAL_DURATION}s) ${GREEN}[PASS]${NC}"
        echo -e "${GREEN}   Target: 45 min → ACHIEVED${NC}"
    else
        echo -e "${RED}❌ Total Duration:${NC}      ${TOTAL_MIN} min (${TOTAL_DURATION}s) ${RED}[FAIL]${NC}"
        echo -e "${RED}   Target: 45 min → EXCEEDED${NC}"
    fi

    echo ""

    # Phase breakdown estimation
    echo "======================================================"
    echo -e "${BLUE}📊 Estimated Phase Breakdown${NC}"
    echo "======================================================"
    echo ""

    echo "| Phase | Target | Status |"
    echo "|-------|--------|--------|"
    echo "| Phase 1: Issue Analysis      | < 2 min   | ✅ (included) |"
    echo "| Phase 2: Task Decomposition  | < 5 min   | ✅ (included) |"
    echo "| Phase 3: Worktree Creation   | < 2 min   | ✅ (included) |"
    echo "| Phase 4: Claude Code Exec    | < 10 min  | ✅ (included) |"
    echo "| Phase 6: Quality Check       | < 3 min   | ✅ (included) |"
    echo "| Phase 7: PR Creation         | < 1 min   | ✅ (included) |"
    echo "| Phase 8: Code Review         | < 5 min   | ✅ (included) |"
    echo "| Phase 9: Auto-Merge          | < 3 min   | ✅ (included) |"
    echo ""

    # Summary
    echo "======================================================"
    echo -e "${BLUE}📝 Summary${NC}"
    echo "======================================================"
    echo ""

    echo -e "${CYAN}Issue:${NC}   $ISSUE_URL"
    echo -e "${CYAN}PR:${NC}      $PR_URL"
    echo ""

    if [ $TOTAL_DURATION -le $TARGET_SEC ]; then
        echo -e "${GREEN}✅ Performance: EXCELLENT${NC}"
        echo -e "${GREEN}   Workflow completed within 45-minute target${NC}"
    else
        echo -e "${YELLOW}⚠️  Performance: NEEDS IMPROVEMENT${NC}"
        echo -e "${YELLOW}   Workflow exceeded 45-minute target${NC}"
    fi

    echo ""
    echo "For detailed logs:"
    echo "  - Issue comments: gh issue view $ISSUE_NUMBER --comments"
    echo "  - PR timeline: gh pr view $PR_NUMBER"

else
    echo "======================================================"
    echo -e "${YELLOW}⏱️  Partial Performance Metrics${NC}"
    echo "======================================================"
    echo ""

    ISSUE_CREATED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$ISSUE_CREATED" +%s 2>/dev/null || date -d "$ISSUE_CREATED" +%s)
    PR_CREATED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$PR_CREATED" +%s 2>/dev/null || date -d "$PR_CREATED" +%s)

    PHASE_1_6_DURATION=$((PR_CREATED_SEC - ISSUE_CREATED_SEC))
    PHASE_1_6_MIN=$((PHASE_1_6_DURATION / 60))

    echo -e "${CYAN}📍 Issue Created:${NC}     $ISSUE_CREATED"
    echo -e "${CYAN}📍 PR Created:${NC}        $PR_CREATED"
    echo ""

    echo -e "${YELLOW}⏱️  Phase 1-6 Duration:${NC}  ${PHASE_1_6_MIN} min (${PHASE_1_6_DURATION}s)"
    echo ""
    echo -e "${YELLOW}⚠️  Waiting for PR merge to complete measurement...${NC}"
    echo ""
    echo "Monitor PR status:"
    echo "  gh pr view $PR_NUMBER"
fi
