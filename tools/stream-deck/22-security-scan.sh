#!/bin/bash
# Stream Deck Button 22: Security Scan
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/security-scan"
