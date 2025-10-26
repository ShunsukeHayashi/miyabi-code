#!/bin/bash
# Stream Deck Shortcut: Voice Notification
# Usage: 音声通知を送信

cd "$(dirname "$0")/../.." || exit 1

MESSAGE="${1:-Stream Deckからの通知です}"

tools/voicevox_enqueue.sh "$MESSAGE"

# macOS通知も送信
osascript -e "display notification \"$MESSAGE\" with title \"Miyabi - Voice Notification\""
