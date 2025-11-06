#!/bin/bash
# Command logging hook

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Tool executed: $@" >> .codex/logs/commands.log
