#!/bin/bash
# Stream Deck: SSH to MUGEN
# Connect to MUGEN (Layer 3a Coordinator)

osascript <<EOF
tell application "Terminal"
    activate
    do script "ssh mugen"
end tell
EOF

osascript -e 'display notification "MUGEN接続中..." with title "🌊 Stream Deck"'
