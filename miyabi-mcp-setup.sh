#!/bin/bash

# Miyabi Private MCP Setup Script
# Lark MCP Enhanced with Auto Permission Management

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_miyabi() {
    echo -e "${PURPLE}[MIYABI]${NC} $1"
}

# プロジェクト情報
PROJECT_NAME="Miyabi Private"
PROJECT_DIR="/Users/shunsuke/Dev/miyabi-private"
LARK_MCP_DIR="$PROJECT_DIR/mcp-servers/lark-mcp-enhanced"
SOURCE_MCP_DIR="/Users/shunsuke/lark-openapi-mcp-enhanced"
APP_ID="cli_a8d2fdb1f1f8d02d"
APP_SECRET="V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ"
DOMAIN="https://open.feishu.cn"
AUTO_USER="hayashi.s@customercloud.ai"

# ヘッダー表示
echo "=========================================="
echo "🎌 Miyabi Private MCP Setup Script"
echo "=========================================="
echo "Project: $PROJECT_NAME"
echo "Auto Permission User: $AUTO_USER"
echo "Lark MCP Source: $SOURCE_MCP_DIR"
echo "Lark MCP Target: $LARK_MCP_DIR"
echo "=========================================="
echo ""

# 1. プロジェクトディレクトリの確認
log_miyabi "Miyabi privateプロジェクトディレクトリを確認中..."
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Miyabi privateプロジェクトディレクトリが見つかりません: $PROJECT_DIR"
    exit 1
fi
log_success "Miyabi privateプロジェクトディレクトリを確認しました"

# 2. ソースMCPディレクトリの確認
log_info "Lark MCPソースディレクトリを確認中..."
if [ ! -d "$SOURCE_MCP_DIR" ]; then
    log_error "Lark MCPソースディレクトリが見つかりません: $SOURCE_MCP_DIR"
    exit 1
fi
log_success "Lark MCPソースディレクトリを確認しました"

# 3. Miyabiプロジェクトディレクトリに移動
log_info "Miyabiプロジェクトディレクトリに移動中..."
cd "$PROJECT_DIR"

# 4. MCPサーバーディレクトリの作成
log_info "MCPサーバーディレクトリを作成中..."
mkdir -p mcp-servers/lark-mcp-enhanced
log_success "MCPサーバーディレクトリを作成しました"

# 5. Lark MCPツールのコピー
log_info "Lark MCPツールをコピー中..."
if [ -d "$SOURCE_MCP_DIR/dist" ]; then
    cp -r "$SOURCE_MCP_DIR/dist" "$LARK_MCP_DIR/"
    log_success "Lark MCPツールをコピーしました"
else
    log_error "Lark MCPのdistディレクトリが見つかりません"
    exit 1
fi

# 6. package.jsonの作成
log_info "package.jsonを作成中..."
cat > "$LARK_MCP_DIR/package.json" << EOF
{
  "name": "lark-mcp-enhanced",
  "version": "0.4.0",
  "description": "Feishu/Lark OpenAPI MCP with Auto Permission Management for Miyabi",
  "main": "dist/cli.js",
  "type": "commonjs",
  "scripts": {
    "start": "node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --domain $DOMAIN --tools preset.default,auto.permission.manager",
    "start:base": "node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --domain $DOMAIN --tools preset.base.default,auto.permission.manager",
    "start:docs": "node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --domain $DOMAIN --tools preset.doc.default,auto.permission.manager",
    "start:collab": "node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --domain $DOMAIN --tools preset.im.default,preset.calendar.default,preset.task.default,auto.permission.manager",
    "start:genesis": "node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --domain $DOMAIN --tools preset.genesis.default,auto.permission.manager"
  },
  "keywords": [
    "feishu",
    "lark",
    "mcp",
    "open-api",
    "ai",
    "auto-permission",
    "miyabi"
  ],
  "author": "Miyabi Team",
  "license": "MIT",
  "engines": {
    "node": ">=16.20.0"
  }
}
EOF
log_success "package.jsonを作成しました"

# 7. README.mdの作成
log_info "README.mdを作成中..."
cat > "$LARK_MCP_DIR/README.md" << EOF
# Lark MCP Enhanced for Miyabi

Feishu/Lark OpenAPI MCPツール with 自動権限管理機能 for Miyabi private project.

## 機能

- **自動権限管理**: \`$AUTO_USER\` に自動的に権限を付与
- **Base管理**: Base作成、テーブル管理、レコード操作
- **ドキュメント管理**: ドキュメント作成、編集、検索
- **コラボレーション**: メッセージ、カレンダー、タスク管理
- **AI機能**: Genesis AIシステム

## 使用方法

### 基本起動
\`\`\`bash
npm start
\`\`\`

### 機能別起動
\`\`\`bash
# Base機能のみ
npm run start:base

# ドキュメント機能のみ
npm run start:docs

# コラボレーション機能
npm run start:collab

# AI機能
npm run start:genesis
\`\`\`

## 自動権限管理

- Base作成時: 自動的に \`$AUTO_USER\` に編集権限を付与
- ドキュメント作成時: 自動的に \`$AUTO_USER\` に編集権限を付与
- 手動権限管理: \`auto_permission_manager\` ツールで任意のリソースに権限を付与

## Miyabi統合

このMCPサーバーはMiyabi private projectの一部として統合されています。
EOF
log_success "README.mdを作成しました"

# 8. MCP設定ファイルの作成
log_info "MCP設定ファイルを作成中..."
cat > "$PROJECT_DIR/mcp-settings.json" << EOF
{
  "mcpServers": {
    "lark-mcp-enhanced": {
      "command": "node",
      "args": [
        "$LARK_MCP_DIR/dist/cli.js",
        "mcp",
        "--mode",
        "stdio",
        "-a",
        "$APP_ID",
        "-s",
        "$APP_SECRET",
        "-d",
        "$DOMAIN",
        "-t",
        "preset.default,auto.permission.manager"
      ]
    },
    "lark-base": {
      "command": "node",
      "args": [
        "$LARK_MCP_DIR/dist/cli.js",
        "mcp",
        "--mode",
        "stdio",
        "-a",
        "$APP_ID",
        "-s",
        "$APP_SECRET",
        "-d",
        "$DOMAIN",
        "-t",
        "preset.base.default,auto.permission.manager"
      ]
    },
    "lark-docs": {
      "command": "node",
      "args": [
        "$LARK_MCP_DIR/dist/cli.js",
        "mcp",
        "--mode",
        "stdio",
        "-a",
        "$APP_ID",
        "-s",
        "$APP_SECRET",
        "-d",
        "$DOMAIN",
        "-t",
        "preset.doc.default,auto.permission.manager"
      ]
    },
    "lark-collab": {
      "command": "node",
      "args": [
        "$LARK_MCP_DIR/dist/cli.js",
        "mcp",
        "--mode",
        "stdio",
        "-a",
        "$APP_ID",
        "-s",
        "$APP_SECRET",
        "-d",
        "$DOMAIN",
        "-t",
        "preset.im.default,preset.calendar.default,preset.task.default,auto.permission.manager"
      ]
    },
    "lark-genesis": {
      "command": "node",
      "args": [
        "$LARK_MCP_DIR/dist/cli.js",
        "mcp",
        "--mode",
        "stdio",
        "-a",
        "$APP_ID",
        "-s",
        "$APP_SECRET",
        "-d",
        "$DOMAIN",
        "-t",
        "preset.genesis.default,auto.permission.manager"
      ]
    },
    "context-engineering": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/mcp-servers/context-engineering/index.js"
      ]
    }
  }
}
EOF
log_success "MCP設定ファイルを作成しました: $PROJECT_DIR/mcp-settings.json"

# 9. MCPツールのテスト
log_info "MCPツールをテスト中..."
cd "$LARK_MCP_DIR"

# ツール一覧の取得テスト
TOOLS_TEST=$(echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | \
    timeout 10s node dist/cli.js mcp --mode stdio \
    --app-id "$APP_ID" \
    --app-secret "$APP_SECRET" \
    --domain "$DOMAIN" \
    --tools "preset.base.default,auto.permission.manager" 2>/dev/null || echo "timeout")

if [[ "$TOOLS_TEST" == *"auto_permission_manager"* ]]; then
    log_success "MCPツールのテストが成功しました"
else
    log_warning "MCPツールのテストで問題が発生しましたが、設定は完了しています"
fi

# 10. セットアップ完了メッセージ
echo ""
echo "=========================================="
echo "🎌 Miyabi Private MCP Setup 完了！"
echo "=========================================="
echo ""
echo "📋 セットアップ内容:"
echo "  • プロジェクト: $PROJECT_NAME"
echo "  • 自動権限ユーザー: $AUTO_USER"
echo "  • Lark MCPディレクトリ: $LARK_MCP_DIR"
echo "  • MCP設定ファイル: $PROJECT_DIR/mcp-settings.json"
echo ""
echo "🚀 利用可能なMCPサーバー:"
echo "  • lark-mcp-enhanced: 全機能 + 自動権限管理"
echo "  • lark-base: Base機能 + 自動権限管理"
echo "  • lark-docs: ドキュメント機能 + 自動権限管理"
echo "  • lark-collab: コラボレーション機能"
echo "  • lark-genesis: AI機能 + 自動権限管理"
echo "  • context-engineering: 既存のコンテキストエンジニアリング"
echo ""
echo "💡 使用方法:"
echo "  1. Cursorを再起動してください"
echo "  2. MCP設定ファイルをCursorに設定してください:"
echo "     $PROJECT_DIR/mcp-settings.json"
echo "  3. チャットで以下のような指示を出してください:"
echo "     • '新しいBaseを作成してください'"
echo "     • '会議資料のドキュメントを作成してください'"
echo "     • '$AUTO_USERに権限を追加してください'"
echo ""
echo "🔧 自動権限管理機能:"
echo "  • Base作成時: 自動的に $AUTO_USER に編集権限を付与"
echo "  • ドキュメント作成時: 自動的に $AUTO_USER に編集権限を付与"
echo "  • 手動権限管理: auto_permission_manager ツールで任意のリソースに権限を付与"
echo ""
echo "📚 Miyabi統合:"
echo "  • Lark MCPツールがMiyabi private projectに統合されました"
echo "  • 既存のcontext-engineering MCPサーバーと共存します"
echo ""
echo "=========================================="
echo "🎉 Miyabi Private MCP Setup が完了しました！"
echo "=========================================="
