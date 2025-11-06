#!/bin/bash
# Agent event logging hook

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
EVENT="$1"
AGENT_NAME="$2"
echo "[$TIMESTAMP] Agent event: $EVENT - $AGENT_NAME" >> .codex/logs/agents.log
