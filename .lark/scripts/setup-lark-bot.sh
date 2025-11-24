#!/bin/bash
# Miyabi Lark統合 - 初期セットアップスクリプト
# Version: 1.0.0

set -e

echo "🚀 Miyabi Lark統合 - セットアップ開始"
echo "=========================================="

# プロジェクトルートディレクトリ
PROJECT_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
LARK_DIR="${PROJECT_ROOT}/.lark"
MCP_SERVER_DIR="${PROJECT_ROOT}/mcp-servers/lark-mcp-enhanced"

# Step 1: 認証情報ファイルの確認
echo ""
echo "📋 Step 1: 認証情報ファイルの確認"
if [ ! -f "${LARK_DIR}/config/credentials.json" ]; then
    echo "⚠️  credentials.json が見つかりません"
    echo "   以下のコマンドでテンプレートをコピーしてください："
    echo ""
    echo "   cp ${LARK_DIR}/config/credentials.json.example ${LARK_DIR}/config/credentials.json"
    echo ""
    echo "   その後、credentials.json を編集してApp IDとApp Secretを設定してください"
    exit 1
else
    echo "✅ credentials.json が存在します"
fi

# Step 2: MCPサーバーの依存関係インストール
echo ""
echo "📦 Step 2: MCPサーバーの依存関係インストール"
cd "${MCP_SERVER_DIR}"

if [ ! -d "node_modules" ]; then
    echo "   npm install を実行中..."
    npm install
    echo "✅ 依存関係のインストール完了"
else
    echo "✅ 依存関係は既にインストール済み"
fi

# Step 3: MCPサーバーのビルド
echo ""
echo "🔨 Step 3: MCPサーバーのビルド"
if [ -f "dist/cli.js" ]; then
    echo "✅ ビルド済みのファイルを検出（dist/cli.js）"
else
    echo "⚠️  ビルドファイルが見つかりません"
    echo "   lark-mcp-enhanced はビルド済みバージョンです"
fi

# Step 4: 環境設定の確認
echo ""
echo "⚙️  Step 4: 環境設定の確認"
if [ ! -f "${MCP_SERVER_DIR}/.env" ]; then
    echo "⚠️  .env ファイルが見つかりません"
    echo "   以下の内容で ${MCP_SERVER_DIR}/.env を作成してください："
    echo ""
    echo "   APP_ID=あなたのApp ID"
    echo "   APP_SECRET=あなたのApp Secret"
    echo "   LARK_DOMAIN=https://open.feishu.cn"
    echo "   LARK_LANGUAGE=ja"
    echo ""
else
    echo "✅ .env ファイルが存在します"
fi

# Step 5: 設定ファイルの検証
echo ""
echo "🔍 Step 5: 設定ファイルの検証"

if [ -f "${LARK_DIR}/config/environments.json" ]; then
    echo "✅ environments.json"
else
    echo "❌ environments.json が見つかりません"
fi

if [ -f "${LARK_DIR}/config/mcp-servers.json" ]; then
    echo "✅ mcp-servers.json"
else
    echo "❌ mcp-servers.json が見つかりません"
fi

if [ -f "${LARK_DIR}/config/sync-settings.json" ]; then
    echo "✅ sync-settings.json"
else
    echo "❌ sync-settings.json が見つかりません"
fi

# Step 6: テンプレートの確認
echo ""
echo "📝 Step 6: テンプレートの確認"

TEMPLATE_COUNT=$(find "${LARK_DIR}/templates" -type f -name "*.json" -o -name "*.md" | wc -l)
echo "✅ ${TEMPLATE_COUNT} 個のテンプレートファイルを検出"

# Step 7: セットアップ完了
echo ""
echo "=========================================="
echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ："
echo "1. credentials.json にApp IDとApp Secretを設定"
echo "2. MCPサーバーを起動: cd ${MCP_SERVER_DIR} && npm start"
echo "3. グループチャットを作成（SETUP.md参照）"
echo "4. テスト通知を送信"
echo ""
echo "詳細なセットアップ手順："
echo "  ${LARK_DIR}/docs/SETUP.md"
echo ""
