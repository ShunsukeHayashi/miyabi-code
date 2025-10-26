#!/bin/bash
# Stream Deck: Agent Run Shortcut
# 最新の未処理Issueに対してCoordinatorAgentを実行

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🤖 Agent Run Shortcut"
echo "===================="
echo ""

# GitHub CLIで最新の未処理Issue番号を取得（ラベル: agent-execute）
LATEST_ISSUE=$(gh issue list --label "🤖agent-execute" --limit 1 --json number --jq '.[0].number' 2>/dev/null)

if [ -n "$LATEST_ISSUE" ]; then
    echo "📋 最新のAgent実行対象Issue: #$LATEST_ISSUE"
    echo ""

    # /agent-run コマンドを送信
    "$SCRIPT_DIR/05-send-to-claude.sh" "/agent-run coordinator --issue $LATEST_ISSUE"

    echo "✅ Agent実行コマンド送信完了"
    echo "   Claude CodeがCoordinatorAgentを起動します..."
else
    echo "⚠️  agent-executeラベルが付いたIssueが見つかりません"
    echo ""
    echo "💡 ヒント:"
    echo "   1. Issue作成: /create-issue"
    echo "   2. 手動でラベル 🤖agent-execute を付与"
    echo "   3. このボタンを再度押す"
    echo ""

    # Issue作成を促すメッセージを送信
    "$SCRIPT_DIR/05-send-to-claude.sh" "Agent実行対象のIssueが見つかりませんでした。/create-issue でIssueを作成してください。"
fi
