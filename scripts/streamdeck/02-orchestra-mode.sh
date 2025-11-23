#!/bin/bash
# Stream Deck: Orchestra Mode
# Launch full Miyabi Orchestra with all 14 business agents

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd ~/Dev/miyabi-private && tmux attach-session -t orchestra || tmux new-session -s orchestra -d && tmux send-keys -t orchestra 'cd ~/Dev/miyabi-private && ./scripts/launch-orchestra.sh' Enter"
end tell
EOF

osascript -e 'display notification "Orchestra起動中...14 Agents展開" with title "🎭 Stream Deck"'
