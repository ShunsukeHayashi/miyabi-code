#!/bin/bash
# Stream Deck Mobile - 自動セットアップ

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 Stream Deck Mobile - 自動セットアップ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Stream Deckアプリが起動しているか確認
if ! pgrep -x "Stream Deck" > /dev/null; then
  echo "⚠️  Stream Deckアプリが起動していません"
  echo "   起動しています..."
  open -a "Elgato Stream Deck"
  sleep 3
fi

echo "✅ Stream Deck起動確認完了"
echo ""

# スクリプトディレクトリ
SCRIPT_DIR="$HOME/Dev/miyabi-private/scripts/streamdeck"

# Profile設定ガイド表示
cat << 'GUIDE'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Stream Deck Mobileアプリで以下を実行してください:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Stream Deck Mobileアプリを開く
2. MacのStream Deckと接続（自動検出）
3. デバイス選択: "Stream Deck Mobile"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Profile 1: Main Dashboard 設定
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

各ボタンに「システム」→「開く」アクションをドラッグ:

Row 1 (最上段):
  Button 1: 🎯 Start Miyabi
    Path: $SCRIPT_DIR/01-start-miyabi.sh
    Color: Green (#00FF00)

  Button 2: 🎭 Orchestra
    Path: $SCRIPT_DIR/02-orchestra-mode.sh
    Color: Purple (#9B59B6)

  Button 3: 📊 Status
    Path: $SCRIPT_DIR/03-status-check.sh
    Color: Blue (#3498DB)

  Button 4: 🔄 Sync
    Path: $SCRIPT_DIR/04-sync-all.sh
    Color: Orange (#FF9800)

  Button 5: ⚙️ Next
    Action: "Stream Deck" → "Switch Profile"
    Target: (次のProfile作成後に設定)
    Color: Gray (#95A5A6)

Row 2 (中段):
  Button 6: 🌸 Tsubaki
    Path: $SCRIPT_DIR/06-agent-tsubaki.sh
    Color: Pink (#FF69B4)

  Button 7: 🍁 Kaede
    Path: $SCRIPT_DIR/07-agent-kaede.sh
    Color: Dark Red (#8B0000)

  Button 8: 🌺 Sakura
    Path: $SCRIPT_DIR/08-agent-sakura.sh
    Color: Light Pink (#FFB6C1)

  Button 9: 🌊 MUGEN
    Path: $SCRIPT_DIR/09-ssh-mugen.sh
    Color: Cyan (#00FFFF)

  Button 10: ⚡ MAJIN
    Path: $SCRIPT_DIR/10-ssh-majin.sh
    Color: Yellow (#FFFF00)

Row 3 (最下段):
  Button 11: 📝 Issue
    Path: $SCRIPT_DIR/11-issue-create.sh
    Color: Blue (#2196F3)

  Button 12: 💬 Lark
    Path: $SCRIPT_DIR/12-lark-notify.sh
    Color: Green (#4CAF50)

  Button 13: 🎤 Voice
    Path: $SCRIPT_DIR/13-voice-input.sh
    Color: Purple (#673AB7)

  Button 14: 🚀 Deploy
    Path: $SCRIPT_DIR/14-deploy-now.sh
    Color: Dark Blue (#0D47A1)

  Button 15: 🛑 Stop
    Path: $SCRIPT_DIR/15-stop-all.sh
    Color: RED (#F44336)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUIDE

echo ""
echo "✅ セットアップガイド表示完了"
echo ""
echo "次: Stream Deck Mobileで上記の設定を実行してください"
echo ""
