#!/bin/bash
# Stream Deck Shortcut: Send Text to Claude Code
# Usage: Claude Codeセッションにテキストを送信
# Note: セッションが停止していても自動的に再起動します

MESSAGE="${1:-Next}"

# クリップボードにコピー（IME影響を回避）
echo -n "$MESSAGE" | pbcopy

# VS Codeをアクティブにしてテキストを送信
osascript <<EOF
tell application "Visual Studio Code"
    activate
end tell

delay 0.5

tell application "System Events"
    -- Claude Codeチャットを開く（Cmd+L）
    -- セッションが停止していても、このコマンドで再起動されます
    keystroke "l" using command down
    delay 0.8

    -- セッションが確実に起動するまで待機
    -- （停止していた場合、起動に時間がかかる可能性があるため）
    delay 0.5

    -- クリップボードから貼り付け（Cmd+V）
    -- IMEの影響を受けずに確実にテキストを送信
    keystroke "v" using command down
    delay 0.3

    -- Enter送信
    key code 36
end tell
EOF

echo "📤 Sent to Claude Code: $MESSAGE"

# 音声通知
cd "$(dirname "$0")/../.." || exit 1
tools/voicevox_enqueue.sh "Claude Codeに指示を送信しました: $MESSAGE"
