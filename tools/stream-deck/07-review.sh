#!/bin/bash
# Stream Deck Button 07: Code Review
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/review"
