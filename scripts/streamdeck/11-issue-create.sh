#!/bin/bash
# Stream Deck: Issue Create
# Quick GitHub Issue creation via voice input

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd ~/Dev/miyabi-private && echo '音声でIssueタイトルを話してください...' && read -p 'Issue Title: ' TITLE && gh issue create --title \"\$TITLE\" --body '📱 Created via Stream Deck Mobile'"
end tell
EOF

osascript -e 'display notification "Issue作成中..." with title "📝 Stream Deck"'
