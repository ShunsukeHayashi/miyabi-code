#!/bin/bash
# Stream Deck Button 30: Session End Notification
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/session-end"
