#!/bin/bash
# Stream Deck: Start Miyabi
# Opens terminal and launches Claude Code in Miyabi project

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd ~/Dev/miyabi-private && claude"
end tell
EOF

# Send notification
osascript -e 'display notification "Miyabi起動中..." with title "🎯 Stream Deck"'
