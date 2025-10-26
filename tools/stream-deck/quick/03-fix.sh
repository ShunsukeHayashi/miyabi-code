#!/bin/bash
# Stream Deck: Fix ボタン
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Fix the build errors and make sure all tests pass"
