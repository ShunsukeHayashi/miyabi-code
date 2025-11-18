#!/bin/bash

# 🔐 Miyabi Society Connector - 認証セットアップ

echo "🔐 Miyabi 認証キー生成"
echo "======================"
echo ""

# API Key生成
API_KEY=$(openssl rand -hex 32)
echo "✅ API Key (Claude用):"
echo "   $API_KEY"
echo ""

# Bearer Token生成
BEARER_TOKEN=$(openssl rand -hex 32)
echo "✅ Bearer Token (汎用):"
echo "   $BEARER_TOKEN"
echo ""

# OAuth2 Client Secret生成
CLIENT_SECRET=$(openssl rand -hex 24)
echo "✅ OAuth2 Client Secret (ChatGPT用):"
echo "   $CLIENT_SECRET"
echo ""

# .env ファイル作成
ENV_FILE="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-sse-gateway/.env"

cat > "$ENV_FILE" << ENVEOF
# Miyabi SSE Gateway - 認証設定
# 生成日時: $(date)

PORT=3003

# API Key認証 (Claude Desktop/Code用)
MIYABI_API_KEY=$API_KEY

# Bearer Token認証
MIYABI_BEARER_TOKEN=$BEARER_TOKEN

# OAuth2設定 (ChatGPT Connected Apps用)
OAUTH2_CLIENT_ID=miyabi-society
OAUTH2_CLIENT_SECRET=$CLIENT_SECRET
OAUTH2_REDIRECT_URI=https://chat.openai.com/aip/callback

# CORS設定
ALLOWED_ORIGINS=*
ENVEOF

echo "✅ .env ファイル作成完了:"
echo "   $ENV_FILE"
echo ""

echo "📋 次のステップ:"
echo "1. Claude Desktop 設定に API Key を追加"
echo "2. ChatGPT Custom GPT に認証情報を設定"
echo "3. SSE Gateway を再起動"
echo ""

# Claude Desktop設定例を表示
echo "📱 Claude Desktop 設定例:"
echo '{'
echo '  "mcpServers": {'
echo '    "miyabi-society": {'
echo '      "command": "node",'
echo '      "args": ["..."],'
echo '      "env": {'
echo "        \"MIYABI_API_KEY\": \"$API_KEY\""
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""

