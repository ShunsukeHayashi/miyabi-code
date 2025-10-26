#!/bin/bash
# Stream Deck: PR ボタン
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Create a pull request for the current branch"
