#!/bin/bash
# Stream Deck Button 08: Clippy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Run cargo clippy --all and fix all warnings"
