#!/bin/bash
# Stream Deck Button 31: Generate Landing Page
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/generate-lp"
