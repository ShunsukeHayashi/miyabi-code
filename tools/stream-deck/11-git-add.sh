#!/bin/bash
# Stream Deck Button 11: Git Add
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Stage all changes for commit (git add .)"
