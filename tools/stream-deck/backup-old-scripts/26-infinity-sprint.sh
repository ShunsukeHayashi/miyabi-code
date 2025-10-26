#!/bin/bash
# Stream Deck: Infinity Sprint Launch
# 無限自律実行モードを起動（全Issue自動処理）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "♾️  Infinity Sprint Launch"
echo "========================="
echo ""

# Issue数を確認
PENDING_ISSUES=$(gh issue list --label "🤖agent-execute" --json number --jq 'length' 2>/dev/null)

if [ "$PENDING_ISSUES" -gt 0 ]; then
    echo "📊 実行対象Issue: $PENDING_ISSUES 件"
    echo ""
    echo "🚀 Infinity Sprintを起動します..."
    echo "   • 自動Issue取得"
    echo "   • 並列実行（max 3並列）"
    echo "   • 失敗時自動リトライ"
    echo "   • 音声通知対応"
    echo ""

    # /miyabi-infinity コマンドを送信
    "$SCRIPT_DIR/05-send-to-claude.sh" "/miyabi-infinity"

    echo "✅ Infinity Sprint起動コマンド送信完了"
    echo "   Claude Codeが無限自律実行を開始します..."
else
    echo "⚠️  実行対象のIssueがありません"
    echo ""
    echo "💡 次のステップ:"
    echo "   1. /create-issue でIssueを作成"
    echo "   2. 自動でagent-executeラベルが付与される"
    echo "   3. このボタンを再度押してSprint起動"
    echo ""

    # Issue作成を促す
    "$SCRIPT_DIR/05-send-to-claude.sh" "Infinity Sprint起動には、agent-executeラベル付きIssueが必要です。/create-issue でIssueを作成してください。"
fi
