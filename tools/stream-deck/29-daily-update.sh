#!/bin/bash
# Stream Deck Button 29: Daily Update Report
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/daily-update"
