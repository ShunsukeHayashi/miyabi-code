#!/bin/bash
# ==============================================================================
# Discord Webhook Notification Script
# YouTube LIVE Commentary Mode 🎮
# ==============================================================================

set -euo pipefail

# Load environment variables
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
fi

# Check if DISCORD_WEBHOOK_URL is set
if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
    echo "❌ Error: DISCORD_WEBHOOK_URL is not set in .env file"
    exit 1
fi

# Get message from arguments or stdin
if [ $# -gt 0 ]; then
    MESSAGE="$*"
else
    echo "Usage: $0 <message>"
    echo "Example: $0 '🎮 作業開始！Issue #123 を処理します！'"
    exit 1
fi

# Get timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get username (hostname or default)
USERNAME="${DEVICE_IDENTIFIER:-Claude Code}"

# Create JSON payload
# Use jq if available for proper JSON escaping, otherwise use simple sed
if command -v jq &> /dev/null; then
    PAYLOAD=$(jq -n \
        --arg content "$MESSAGE" \
        --arg username "$USERNAME" \
        --arg timestamp "$TIMESTAMP" \
        '{
            content: $content,
            username: $username,
            embeds: [{
                color: 3447003,
                footer: {
                    text: $timestamp
                }
            }]
        }')
else
    # Fallback: simple JSON (escaping quotes)
    MESSAGE_ESCAPED=$(echo "$MESSAGE" | sed 's/"/\\"/g')
    PAYLOAD="{\"content\":\"$MESSAGE_ESCAPED\",\"username\":\"$USERNAME\"}"
fi

# Send to Discord
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$DISCORD_WEBHOOK_URL")

if [ "$HTTP_STATUS" -eq 204 ] || [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Discord notification sent: $MESSAGE"
else
    echo "❌ Failed to send Discord notification (HTTP $HTTP_STATUS)"
    exit 1
fi
