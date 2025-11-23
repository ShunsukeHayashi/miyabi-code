#!/bin/bash
# Stream Deck: SSH to MAJIN
# Connect to MAJIN (Layer 3b Coordinator)

osascript <<EOF
tell application "Terminal"
    activate
    do script "ssh majin"
end tell
EOF

osascript -e 'display notification "MAJIN接続中..." with title "⚡ Stream Deck"'
