#!/bin/bash
# Update last activity timestamp - call this whenever Claude Code responds

ACTIVITY_FILE="/tmp/claude_last_activity"
touch "$ACTIVITY_FILE"
