#!/usr/bin/env bash
QUERY="$*"
echo "🔍 Searching history: ${QUERY}"
cd ~/Dev/miyabi-private && git log --all --grep="${QUERY}" --oneline | head -10
