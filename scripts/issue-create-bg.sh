#!/usr/bin/env bash
set -euo pipefail

# /issue-create バックグラウンド実行スクリプト
# Usage: issue-create-bg.sh "title" --type=feature --priority=P1 --body="..."

# デフォルト値
ISSUE_TITLE=""
ISSUE_TYPE="feature"
ISSUE_PRIORITY="P2"
ISSUE_BODY=""
ISSUE_LABELS=""
ISSUE_ASSIGNEE=""
REPO="customer-cloud/miyabi-private"

# パラメータパース
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --type=*)
      ISSUE_TYPE="${1#*=}"
      shift
      ;;
    --priority=*)
      ISSUE_PRIORITY="${1#*=}"
      shift
      ;;
    --body=*)
      ISSUE_BODY="${1#*=}"
      shift
      ;;
    --labels=*)
      ISSUE_LABELS="${1#*=}"
      shift
      ;;
    --assignee=*)
      ISSUE_ASSIGNEE="${1#*=}"
      shift
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}"

# タイトル必須チェック
if [[ $# -eq 0 ]]; then
  echo "❌ Error: Issue title is required"
  echo "Usage: /issue-create \"title\" --type=feature --priority=P1"
  exit 1
fi

ISSUE_TITLE="$1"

# ラベル組み立て
TYPE_LABEL="type:${ISSUE_TYPE}"
PRIORITY_LABEL="priority:${ISSUE_PRIORITY}"
LABELS="${TYPE_LABEL},${PRIORITY_LABEL}"

if [[ -n "$ISSUE_LABELS" ]]; then
  LABELS="${LABELS},${ISSUE_LABELS}"
fi

# Issue本文が空の場合はデフォルトを設定
if [[ -z "$ISSUE_BODY" ]]; then
  ISSUE_BODY="## Description

Created via /issue-create command.

## Tasks

- [ ] Implement
- [ ] Test  
- [ ] Document

## Notes

_Generated: $(date '+%Y-%m-%d %H:%M:%S')_"
fi

echo "🚀 Creating GitHub Issue..."
echo "  Title: ${ISSUE_TITLE}"
echo "  Type: ${ISSUE_TYPE}"
echo "  Priority: ${ISSUE_PRIORITY}"
echo "  Labels: ${LABELS}"

# GitHub Issue作成
ISSUE_JSON=$(gh issue create \
  --repo "${REPO}" \
  --title "${ISSUE_TITLE}" \
  --body "${ISSUE_BODY}" \
  --label "${LABELS}" \
  --json number,url 2>&1)

if [[ $? -ne 0 ]]; then
  echo "❌ Failed to create issue: ${ISSUE_JSON}"
  exit 1
fi

ISSUE_NUMBER=$(echo "${ISSUE_JSON}" | jq -r '.number')
ISSUE_URL=$(echo "${ISSUE_JSON}" | jq -r '.url')

echo "✅ Issue created successfully!"
echo "  Issue #${ISSUE_NUMBER}"
echo "  URL: ${ISSUE_URL}"

# Assignee設定 (オプション)
if [[ -n "$ISSUE_ASSIGNEE" ]]; then
  gh issue edit "${ISSUE_NUMBER}" --repo "${REPO}" --add-assignee "${ISSUE_ASSIGNEE}"
  echo "  Assigned to: ${ISSUE_ASSIGNEE}"
fi

echo ""
echo "🤖 IssueAgent will analyze this issue automatically."
echo "📊 Check issue status: gh issue view ${ISSUE_NUMBER}"
