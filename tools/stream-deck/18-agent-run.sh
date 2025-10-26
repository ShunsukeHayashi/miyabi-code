#!/bin/bash
# Stream Deck Button 18: Agent Run (latest Issue)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LATEST_ISSUE=$(gh issue list --label "🤖agent-execute" --limit 1 --json number --jq '.[0].number' 2>/dev/null)
if [ -n "$LATEST_ISSUE" ]; then
    "$SCRIPT_DIR/05-send-to-claude.sh" "/agent-run coordinator --issue $LATEST_ISSUE"
else
    "$SCRIPT_DIR/05-send-to-claude.sh" "Agent実行対象のIssueが見つかりませんでした。/create-issue でIssueを作成してください。"
fi
