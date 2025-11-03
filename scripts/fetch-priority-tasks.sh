#!/bin/bash
# Miyabi Orchestra - GitHub Issues Priority-based Task Fetcher
# Version: 1.0.0
# Purpose: Fetch open Issues from GitHub and sort by priority

set -euo pipefail

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
TASK_QUEUE_FILE="$WORKING_DIR/.ai/queue/tasks.json"
REPO="${GITHUB_REPOSITORY:-ShunsukeHayashi/Miyabi}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 GitHub Issues優先順位チェック${NC}"
echo ""

# Fetch open Issues from GitHub
echo -e "${BLUE}📥 GitHub Issuesを取得中...${NC}"

# Get Issues with priority labels
ISSUES_JSON=$(gh issue list \
    --repo "$REPO" \
    --state open \
    --json number,title,labels,createdAt \
    --limit 50)

if [ -z "$ISSUES_JSON" ] || [ "$ISSUES_JSON" == "[]" ]; then
    echo -e "${YELLOW}⚠️  オープンなIssueが見つかりませんでした${NC}"
    exit 0
fi

# Parse and prioritize Issues
echo -e "${BLUE}📊 優先順位を分析中...${NC}"
echo ""

# Create task queue with priority
cat > "$TASK_QUEUE_FILE" <<EOF
{
  "version": "1.0.0",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S+09:00")",
  "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S+09:00")",
  "tasks": [
EOF

FIRST=true

# Process Issues and extract priority
echo "$ISSUES_JSON" | jq -c '.[]' | while read -r issue; do
    ISSUE_NUM=$(echo "$issue" | jq -r '.number')
    ISSUE_TITLE=$(echo "$issue" | jq -r '.title')
    LABELS=$(echo "$issue" | jq -r '.labels[].name')

    # Determine priority from labels
    PRIORITY="medium"
    if echo "$LABELS" | grep -iq "priority:critical\|p0"; then
        PRIORITY="critical"
    elif echo "$LABELS" | grep -iq "priority:high\|p1"; then
        PRIORITY="high"
    elif echo "$LABELS" | grep -iq "priority:medium\|p2"; then
        PRIORITY="medium"
    elif echo "$LABELS" | grep -iq "priority:low\|p3"; then
        PRIORITY="low"
    fi

    # Determine Agent type from labels
    AGENT_TYPE="auto"
    if echo "$LABELS" | grep -iq "agent:codegen\|type:feature\|type:bug"; then
        AGENT_TYPE="カエデ"
    elif echo "$LABELS" | grep -iq "agent:review\|needs-review"; then
        AGENT_TYPE="サクラ"
    elif echo "$LABELS" | grep -iq "agent:pr"; then
        AGENT_TYPE="ツバキ"
    elif echo "$LABELS" | grep -iq "agent:deploy"; then
        AGENT_TYPE="ボタン"
    fi

    # Display Issue info
    PRIORITY_COLOR="$BLUE"
    case "$PRIORITY" in
        "critical") PRIORITY_COLOR="$RED" ;;
        "high") PRIORITY_COLOR="$YELLOW" ;;
        "medium") PRIORITY_COLOR="$BLUE" ;;
        "low") PRIORITY_COLOR="$NC" ;;
    esac

    echo -e "  ${PRIORITY_COLOR}#${ISSUE_NUM}${NC} [${PRIORITY}] ${ISSUE_TITLE} → ${AGENT_TYPE}"

    # Add to task queue (we'll do this in a second pass to avoid subshell issues)
done

# Re-process to build JSON (avoiding subshell issues)
TASKS=""
echo "$ISSUES_JSON" | jq -c '.[]' | while read -r issue; do
    ISSUE_NUM=$(echo "$issue" | jq -r '.number')
    ISSUE_TITLE=$(echo "$issue" | jq -r '.title' | sed 's/"/\\"/g')
    LABELS=$(echo "$issue" | jq -r '.labels[].name')
    CREATED_AT=$(echo "$issue" | jq -r '.createdAt')

    # Determine priority
    PRIORITY="medium"
    if echo "$LABELS" | grep -iq "priority:critical\|p0"; then
        PRIORITY="critical"
    elif echo "$LABELS" | grep -iq "priority:high\|p1"; then
        PRIORITY="high"
    elif echo "$LABELS" | grep -iq "priority:medium\|p2"; then
        PRIORITY="medium"
    elif echo "$LABELS" | grep -iq "priority:low\|p3"; then
        PRIORITY="low"
    fi

    # Determine preferred agent
    PREFERRED_AGENT="null"
    if echo "$LABELS" | grep -iq "agent:codegen\|type:feature\|type:bug"; then
        PREFERRED_AGENT="\"カエデ\""
    elif echo "$LABELS" | grep -iq "agent:review"; then
        PREFERRED_AGENT="\"サクラ\""
    elif echo "$LABELS" | grep -iq "agent:pr"; then
        PREFERRED_AGENT="\"ツバキ\""
    elif echo "$LABELS" | grep -iq "agent:deploy"; then
        PREFERRED_AGENT="\"ボタン\""
    fi

    # Build task entry
    TASK_ENTRY="    {
      \"issue_number\": \"$ISSUE_NUM\",
      \"title\": \"$ISSUE_TITLE\",
      \"priority\": \"$PRIORITY\",
      \"preferred_agent\": $PREFERRED_AGENT,
      \"assigned_agent\": null,
      \"status\": \"pending\",
      \"created_at\": \"$CREATED_AT\",
      \"started_at\": null,
      \"completed_at\": null
    }"

    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$TASK_QUEUE_FILE"
    fi

    echo "$TASK_ENTRY" >> "$TASK_QUEUE_FILE"
done

# Close JSON
cat >> "$TASK_QUEUE_FILE" <<EOF

  ]
}
EOF

echo ""
echo -e "${GREEN}✅ タスクキューを更新しました: $TASK_QUEUE_FILE${NC}"
echo ""
echo -e "${BLUE}📊 優先順位サマリー:${NC}"
jq -r '.tasks | group_by(.priority) | map({priority: .[0].priority, count: length}) | .[] | "  \(.priority): \(.count) issues"' "$TASK_QUEUE_FILE" 2>/dev/null || echo "  (JSON解析エラー)"

echo ""
echo -e "${BLUE}💡 次のステップ:${NC}"
echo -e "  1. タスクキュー確認: ${GREEN}jq . $TASK_QUEUE_FILE${NC}"
echo -e "  2. Water Spider起動: ${GREEN}./scripts/water-spider-monitor-v2.sh${NC}"
echo -e "  3. タスク割り当て開始: ${GREEN}./scripts/assign-task.sh${NC}"
echo ""
