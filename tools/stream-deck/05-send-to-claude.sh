#!/bin/bash
# Stream Deck Shortcut: Send Text to Claude Code
# Usage: Claude Codeセッションにテキストを送信

MESSAGE="${1:-Next}"

# VS Codeをアクティブにしてテキストを送信
osascript <<EOF
tell application "Visual Studio Code"
    activate
end tell

delay 0.5

tell application "System Events"
    -- Claude Code入力欄にフォーカス（Cmd+L）
    keystroke "l" using command down
    delay 0.3

    -- テキスト入力
    keystroke "$MESSAGE"
    delay 0.2

    -- Enter送信
    key code 36
end tell
EOF

echo "📤 Sent to Claude Code: $MESSAGE"

# 音声通知
cd "$(dirname "$0")/../.." || exit 1
tools/voicevox_enqueue.sh "Claude Codeに指示を送信しました: $MESSAGE"
