#!/bin/bash
# Stream Deck Button 27: Narrate Progress
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/narrate"
