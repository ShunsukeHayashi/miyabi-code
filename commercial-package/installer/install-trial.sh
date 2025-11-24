#!/bin/bash
# Miyabi Society Control - 無料お試し版インストーラー
# Version: 1.0.0 Trial

set -e

cat << "BANNER"
╔═══════════════════════════════════════════════════════════════╗
║   ███╗   ███╗██╗██╗   ██╗ █████╗ ██████╗ ██╗                ║
║   ████╗ ████║██║╚██╗ ██╔╝██╔══██╗██╔══██╗██║                ║
║   ██╔████╔██║██║ ╚████╔╝ ███████║██████╔╝██║                ║
║   ██║╚██╔╝██║██║  ╚██╔╝  ██╔══██║██╔══██╗██║                ║
║   ██║ ╚═╝ ██║██║   ██║   ██║  ██║██████╔╝██║                ║
║        Society Control - 無料お試し版 v1.0.0                 ║
╚═══════════════════════════════════════════════════════════════╝
BANNER

echo ""
echo "🎉 Miyabi Society Control - 無料トライアルへようこそ!"
echo ""
echo "📋 トライアル内容:"
echo "   • 19個のMCPサーバー完全版"
echo "   • 75以上のツール使い放題"
echo "   • 期間: 30日間"
echo "   • サポート: コミュニティフォーラム"
echo ""

INSTALL_DIR="${HOME}/.miyabi-society"
BIN_DIR="${INSTALL_DIR}/bin"
CONFIG_DIR="${INSTALL_DIR}/config"
LOG_DIR="${INSTALL_DIR}/logs"

# トライアルライセンス自動生成
TRIAL_LICENSE="MIYABI-TRIAL-$(date +%s | md5sum | head -c 16 | tr '[:lower:]' '[:upper:]')"
TRIAL_EXPIRES=$(date -v+30d '+%Y-%m-%d' 2>/dev/null || date -d '+30 days' '+%Y-%m-%d')

echo "🔑 トライアルライセンス自動発行中..."
echo "   License: ${TRIAL_LICENSE}"
echo "   有効期限: ${TRIAL_EXPIRES}"
echo ""

read -p "インストールを開始しますか? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "インストールをキャンセルしました"
    exit 0
fi

echo ""
echo "📦 インストール中..."

# ディレクトリ作成
mkdir -p "$BIN_DIR" "$CONFIG_DIR" "$LOG_DIR"

# Claude Desktop設定
CLAUDE_DIR="${HOME}/Library/Application Support/Claude"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_DIR="${HOME}/.config/Claude"
fi

mkdir -p "$CLAUDE_DIR"

cat > "$CLAUDE_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "miyabi-society-trial": {
      "command": "${BIN_DIR}/miyabi-launcher",
      "env": {
        "MIYABI_LICENSE_KEY": "${TRIAL_LICENSE}",
        "MIYABI_TRIAL_EXPIRES": "${TRIAL_EXPIRES}",
        "MIYABI_INSTALL_DIR": "${INSTALL_DIR}"
      }
    }
  }
}
EOF

# ランチャー作成
cat > "${BIN_DIR}/miyabi-launcher" << 'LAUNCHER'
#!/bin/bash
INSTALL_DIR="${MIYABI_INSTALL_DIR:-${HOME}/.miyabi-society}"
echo "[$(date)] Miyabi Society Trial started" >> "${INSTALL_DIR}/logs/launcher.log"

# 期限チェック
EXPIRES="${MIYABI_TRIAL_EXPIRES}"
TODAY=$(date '+%Y-%m-%d')
if [[ "$TODAY" > "$EXPIRES" ]]; then
    echo "ERROR: Trial期間が終了しました。" >&2
    echo "継続利用はこちら: https://miyabi.ai/upgrade" >&2
    exit 1
fi

exec "${INSTALL_DIR}/mcp-servers/miyabi-mcp/dist/index.js"
LAUNCHER

chmod +x "${BIN_DIR}/miyabi-launcher"

# ドキュメント
cat > "${INSTALL_DIR}/README.md" << README
# Miyabi Society Control - トライアル版

## ✅ インストール完了!

トライアルライセンス: ${TRIAL_LICENSE}
有効期限: ${TRIAL_EXPIRES} (30日間)

## 🚀 次のステップ

1. **Claude Desktopを再起動**
   \`\`\`bash
   killall Claude && open -a Claude
   \`\`\`

2. **ツールを確認**
   Claude Desktopで:
   \`\`\`
   List all available MCP tools
   \`\`\`

3. **テスト実行**
   \`\`\`
   Execute git repository inspection
   \`\`\`

## 📚 ドキュメント

- クイックスタート: https://docs.miyabi.ai/quickstart
- チュートリアル: https://docs.miyabi.ai/tutorials
- フォーラム: https://community.miyabi.ai

## 💎 アップグレード

トライアル終了後も継続利用:
https://miyabi.ai/upgrade

お問い合わせ: trial@miyabi.ai
README

# 設定ファイル
cat > "${CONFIG_DIR}/trial-info.json" << EOF
{
  "version": "1.0.0-trial",
  "license": "${TRIAL_LICENSE}",
  "expires": "${TRIAL_EXPIRES}",
  "installed": "$(date '+%Y-%m-%d %H:%M:%S')",
  "features": {
    "mcp_servers": 19,
    "total_tools": 75,
    "support": "community"
  }
}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ インストール完了!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 トライアル情報:"
echo "   ライセンス: ${TRIAL_LICENSE}"
echo "   有効期限: ${TRIAL_EXPIRES}"
echo "   インストール: ${INSTALL_DIR}"
echo ""
echo "🚀 次のステップ:"
echo "   1. Claude Desktopを再起動"
echo "   2. ツールリストを確認"
echo "   3. ドキュメントを確認: ${INSTALL_DIR}/README.md"
echo ""
echo "💎 アップグレード: https://miyabi.ai/upgrade"
echo ""
