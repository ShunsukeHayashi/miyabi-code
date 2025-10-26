#!/bin/bash
# Stream Deck Button 25: Voice Command ON
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/voicevox \"やぁやぁ！ずんだもんなのだ！音声システムが起動したのだ！\" 3 1.2"
