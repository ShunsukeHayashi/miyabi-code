#!/bin/bash
# Stream Deck: Voice Command ON (Zundamon読み上げモード)
# VOICEVOX音声通知システムを起動します

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔊 VOICEVOX音声通知システム起動中..."
echo ""

# /voicevox コマンドをClaude Codeに送信
"$SCRIPT_DIR/05-send-to-claude.sh" "/voicevox \"やぁやぁ！ずんだもんなのだ！音声システムが起動したのだ！\" 3 1.2"

echo ""
echo "✅ 音声コマンド送信完了"
echo "   Claude Codeがコマンドを実行します..."
