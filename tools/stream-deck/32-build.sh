#!/bin/bash
# Stream Deck Button 32: Build All
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Build the entire project (cargo build --all)"
