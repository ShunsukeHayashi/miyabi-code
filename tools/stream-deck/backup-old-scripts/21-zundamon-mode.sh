#!/bin/bash
# Stream Deck: Zundamon Reading Mode Activate
# Infinity Sprintログ監視 + 音声通知モードを起動

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🎤 Zundamon Reading Mode Activate"
echo "=================================="
echo ""

# /watch-sprint コマンドを送信（Infinity Sprint監視 + 音声通知）
"$SCRIPT_DIR/05-send-to-claude.sh" "/watch-sprint"

echo ""
echo "✅ Zundamon監視モード起動コマンド送信"
echo "   リアルタイムでタスク進捗を音声通知します"
echo ""
echo "📊 監視内容:"
echo "   • Sprint開始: 「スプリントが始まるのだ！」"
echo "   • タスク成功: 「やったのだ！完了したのだ！」"
echo "   • タスク失敗: 「失敗したのだ！でも諦めないのだ！」"
echo "   • 全完了: 「全部終わったのだ！お疲れ様なのだ！」"
