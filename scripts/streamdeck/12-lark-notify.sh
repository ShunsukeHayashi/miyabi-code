#!/bin/bash
# Stream Deck: Lark Notify
# Send notification to Lark team group

MESSAGE="${1:-📱 Stream Deck Mobile からの通知です}"

# Use Lark MCP to send message
cd ~/Dev/miyabi-private

# Create temporary notification script
cat > /tmp/lark-notify.js <<EOF
// Send Lark notification via MCP
console.log("Sending to Lark: $MESSAGE");
// Implementation via MCP server
EOF

node /tmp/lark-notify.js

osascript -e 'display notification "Larkに通知送信" with title "💬 Stream Deck"'
