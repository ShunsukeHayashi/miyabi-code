#!/bin/bash
# Stream Deck: Commit ボタン
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Create a commit with all current changes"
