#!/bin/bash
# Stream Deck Button 15: Git Pull
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Pull latest changes from remote (git pull)"
