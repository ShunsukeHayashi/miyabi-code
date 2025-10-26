#!/bin/bash
# Stream Deck Button 06: Run Tests
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/test"
