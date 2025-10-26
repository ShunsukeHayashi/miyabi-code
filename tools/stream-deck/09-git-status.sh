#!/bin/bash
# Stream Deck Button 09: Git Status
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Show git status and explain the current state"
