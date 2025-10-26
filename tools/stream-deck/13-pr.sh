#!/bin/bash
# Stream Deck Button 13: Create PR
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Please create a pull request for the current branch"
