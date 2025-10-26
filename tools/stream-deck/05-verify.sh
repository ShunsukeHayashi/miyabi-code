#!/bin/bash
# Stream Deck Button 05: Verify System
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/verify"
