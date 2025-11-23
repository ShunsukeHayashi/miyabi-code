#!/bin/bash
# Miyabi Lark Webhook送信スクリプト
# Usage: ./send-webhook.sh "メッセージ内容"

set -e

# プロジェクトルート
PROJECT_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
CONFIG_FILE="${PROJECT_ROOT}/.lark/groups/miyabi-dev.json"

# Webhook URLを設定ファイルから取得
WEBHOOK_URL=$(jq -r '.webhook.url' "$CONFIG_FILE")

if [ -z "$WEBHOOK_URL" ] || [ "$WEBHOOK_URL" = "null" ]; then
    echo "❌ Error: Webhook URL not found in $CONFIG_FILE"
    exit 1
fi

# メッセージを引数から取得
MESSAGE="${1:-Test message from Miyabi}"

# メッセージを送信
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"msg_type\": \"text\",
    \"content\": {
      \"text\": \"$MESSAGE\"
    }
  }")

# レスポンス確認
STATUS_CODE=$(echo "$RESPONSE" | jq -r '.StatusCode // .code')

if [ "$STATUS_CODE" = "0" ]; then
    echo "✅ メッセージ送信成功"
    echo "📨 Content: $MESSAGE"
else
    echo "❌ メッセージ送信失敗"
    echo "Response: $RESPONSE"
    exit 1
fi
