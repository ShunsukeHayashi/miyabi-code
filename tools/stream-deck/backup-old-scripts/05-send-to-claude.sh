#!/bin/bash
# Stream Deck: Send message to Claude Code (確実版)
# Usage: 05-send-to-claude.sh "Your message here"
# どんな画面・状態でも確実にClaude Codeに入力できます

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
MESSAGE="${1:-Next}"

echo "=========================================="
echo "Stream Deck → Claude Code (確実モード)"
echo "=========================================="
echo "Message: $MESSAGE"
echo "Time: $TIMESTAMP"
echo ""

# Log to file
LOG_FILE="/tmp/stream-deck-messages.log"
echo "[$TIMESTAMP] Sending: $MESSAGE" >> "$LOG_FILE"

# Copy to clipboard
echo -n "$MESSAGE" | pbcopy
echo "✅ Copied to clipboard"
echo ""

# Send to VS Code using AppleScript (シンプル&確実版)
echo "📤 Sending to Claude Code..."

# シンプルで確実な方法 - リトライ機構内蔵
RETRY_COUNT=0
MAX_RETRIES=2

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    osascript -e 'tell application "Visual Studio Code" to activate' \
              -e 'delay 1.2' \
              -e 'tell application "System Events" to keystroke "l" using command down' \
              -e 'delay 1.0' \
              -e 'tell application "System Events" to keystroke "v" using command down' \
              -e 'delay 0.6' \
              -e 'tell application "System Events" to key code 36' 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Message sent successfully"
        echo "[$TIMESTAMP] Success (attempt $((RETRY_COUNT + 1)))" >> "$LOG_FILE"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Failed, retrying... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 1
        else
            echo "❌ Failed after $MAX_RETRIES attempts"
            echo "[$TIMESTAMP] Failed after $MAX_RETRIES attempts" >> "$LOG_FILE"
            exit 1
        fi
    fi
done

echo "=========================================="
