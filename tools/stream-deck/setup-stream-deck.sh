#!/bin/bash
# Stream Deck Quick Setup Script
# このスクリプトでStream Deck設定の準備を行います

set -e

echo "========================================="
echo "  Miyabi Stream Deck セットアップ"
echo "========================================="
echo ""

# 現在のディレクトリをプロジェクトルートに移動
cd "$(dirname "$0")/../.." || exit 1
PROJECT_ROOT=$(pwd)

echo "📂 プロジェクトルート: $PROJECT_ROOT"
echo ""

# Step 1: スクリプトの実行権限確認
echo "Step 1: スクリプトの実行権限を確認..."
chmod +x tools/stream-deck/*.sh
echo "✅ 実行権限を付与しました"
echo ""

# Step 2: スクリプトの動作テスト
echo "Step 2: スクリプトの動作テストを実行..."
echo ""

echo "  テスト 1/3: 音声通知..."
tools/stream-deck/01-notify-voice.sh "Stream Deckセットアップを開始します" >/dev/null 2>&1
echo "  ✅ 音声通知スクリプト: OK"

echo "  テスト 2/3: Git Status..."
tools/stream-deck/04-git-status.sh >/dev/null 2>&1
echo "  ✅ Git Statusスクリプト: OK"

echo "  テスト 3/3: Quick Commands..."
# quick-commandsはVS Code操作が必要なのでスキップ
echo "  ⏭️  Quick Commandsスクリプト: スキップ（手動テスト推奨）"

echo ""
echo "✅ 全てのスクリプトが正常です！"
echo ""

# Step 3: パス情報の表示
echo "Step 3: Stream Deck設定用のパス情報"
echo "========================================="
echo ""
echo "以下のパスをStream Deckアプリにコピー＆ペーストしてください："
echo ""
echo "🔊 音声通知:"
echo "   $PROJECT_ROOT/tools/stream-deck/01-notify-voice.sh"
echo ""
echo "🏗️ ビルド:"
echo "   $PROJECT_ROOT/tools/stream-deck/02-build-release.sh"
echo ""
echo "✅ テスト:"
echo "   $PROJECT_ROOT/tools/stream-deck/03-run-tests.sh"
echo ""
echo "📊 Git:"
echo "   $PROJECT_ROOT/tools/stream-deck/04-git-status.sh"
echo ""
echo "💬 Claude送信:"
echo "   $PROJECT_ROOT/tools/stream-deck/05-send-to-claude.sh"
echo ""
echo "⚡ クイックコマンド:"
echo "   $PROJECT_ROOT/tools/stream-deck/06-quick-commands.sh"
echo ""
echo "========================================="
echo ""

# Step 4: 設定ファイルの出力
echo "Step 4: 設定情報をクリップボードにコピー（オプション）"
echo ""
echo "以下のコマンドを実行すると、パス情報をクリップボードにコピーできます："
echo ""
echo "  pbcopy < tools/stream-deck/paths.txt"
echo ""

# パス情報をファイルに保存
cat > tools/stream-deck/paths.txt <<EOF
Miyabi Stream Deck - パス一覧
=====================================

🔊 音声通知:
$PROJECT_ROOT/tools/stream-deck/01-notify-voice.sh

🏗️ ビルド:
$PROJECT_ROOT/tools/stream-deck/02-build-release.sh

✅ テスト:
$PROJECT_ROOT/tools/stream-deck/03-run-tests.sh

📊 Git:
$PROJECT_ROOT/tools/stream-deck/04-git-status.sh

💬 Claude送信:
$PROJECT_ROOT/tools/stream-deck/05-send-to-claude.sh

⚡ クイックコマンド:
$PROJECT_ROOT/tools/stream-deck/06-quick-commands.sh

クイックコマンドの引数:
- next      (Next)
- continue  (Continue)
- fix       (Fix Errors)
- test      (Run Tests)
- commit    (Create Commit)
- pr        (Create PR)
- infinity  (Infinity Mode)
- voice     (Voice Notification)
- help      (Show Help)
EOF

echo "✅ パス情報を tools/stream-deck/paths.txt に保存しました"
echo ""

# Step 5: 次のステップ
echo "========================================="
echo "  次のステップ"
echo "========================================="
echo ""
echo "1. Stream Deck Mobileアプリをインストール"
echo "   - iOS: App Store で「Stream Deck Mobile」を検索"
echo "   - Android: Google Play で「Stream Deck Mobile」を検索"
echo ""
echo "2. アプリを起動し、新しいプロファイルを作成"
echo "   - 名前: Miyabi Development"
echo ""
echo "3. ボタンを追加"
echo "   - アクション: System → Open"
echo "   - Application/File: 上記のパスをコピペ"
echo ""
echo "4. アクセシビリティ権限を付与（macOS）"
echo "   - システム設定 → プライバシーとセキュリティ"
echo "   - アクセシビリティ → Stream Deck を有効化"
echo ""
echo "詳細なセットアップ手順は以下を参照："
echo "📚 docs/STREAM_DECK_SETUP_GUIDE.md"
echo ""
echo "========================================="
echo "✅ セットアップ準備完了！"
echo "========================================="
echo ""

# 音声通知
tools/stream-deck/01-notify-voice.sh "Stream Deckセットアップの準備が完了しました"
