#!/bin/bash
# Stream Deck Button 12: Git Commit
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Please create a git commit with all changes"
