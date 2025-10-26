#!/bin/bash
# Stream Deck Button 16: Git Merge
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Help me merge the current branch"
