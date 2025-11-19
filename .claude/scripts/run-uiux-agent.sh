#!/bin/bash
# UI/UX Agent実行スクリプト

cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# プロンプトとステートを読み込み
PROMPT=$(cat .claude/prompts/uiux-review-webui.txt)
STATE=$(cat .claude/templates/uiux-review-state.json)

# Timestampを現在時刻に置換
TIMESTAMP=$(date -Iseconds)
PROMPT="${PROMPT//\{\{TIMESTAMP\}\}/$TIMESTAMP}"
PROMPT="${PROMPT//\{\{WEBUI_STATE\}\}/$STATE}"

# Claude実行
claude -p "$PROMPT" > .claude/logs/uiux-agent-review-$(date +%Y%m%d-%H%M%S).log 2>&1

echo "✅ UI/UX Agent completed"
echo "Log: .claude/logs/uiux-agent-review-*.log"
