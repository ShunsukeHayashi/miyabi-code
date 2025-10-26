#!/bin/bash
# Stream Deck Button 17: Create Issue
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/create-issue"
