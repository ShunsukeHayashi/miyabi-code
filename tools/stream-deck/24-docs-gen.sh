#!/bin/bash
# Stream Deck Button 24: Generate Docs
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/generate-docs"
