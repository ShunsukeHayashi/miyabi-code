#!/bin/bash
# Stream Deck Button 23: Deploy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/deploy"
