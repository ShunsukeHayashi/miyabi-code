#!/bin/bash
# Security Agent実行スクリプト

cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# プロンプトとステートを読み込み
PROMPT=$(cat .claude/prompts/security-review-webui.txt)
STATE=$(cat .claude/templates/security-review-state.json)

# Timestampを現在時刻に置換
TIMESTAMP=$(date -Iseconds)
PROMPT="${PROMPT//\{\{TIMESTAMP\}\}/$TIMESTAMP}"
PROMPT="${PROMPT//\{\{SECURITY_STATE\}\}/$STATE}"

# Claude実行
claude -p "$PROMPT" > .claude/logs/security-agent-review-$(date +%Y%m%d-%H%M%S).log 2>&1

echo "✅ Security Agent completed"
echo "Log: .claude/logs/security-agent-review-*.log"
