#!/bin/bash
# Stream Deck Button 14: Git Push
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Push the current branch to remote (git push)"
