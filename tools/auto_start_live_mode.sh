#!/bin/bash
# Miyabi LIVE Mode Auto-Start Script
# Called automatically by miyabi CLI when live_mode.auto_start = true

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIVE_MODE_SCRIPT="$PROJECT_ROOT/tools/live_mode.sh"
MIYABI_CONFIG="$PROJECT_ROOT/.miyabi.yml"
PID_FILE="/tmp/miyabi_live/live_mode.pid"

# Check if .miyabi.yml exists
if [ ! -f "$MIYABI_CONFIG" ]; then
    echo "⚠️  .miyabi.yml not found. LIVE mode disabled."
    exit 0
fi

# Check if live_mode.enabled is true (simple grep check)
if ! grep -q "enabled: true" "$MIYABI_CONFIG" 2>/dev/null; then
    echo "ℹ️  LIVE mode disabled in .miyabi.yml"
    exit 0
fi

# Check if live_mode.auto_start is true
if ! grep -q "auto_start: true" "$MIYABI_CONFIG" 2>/dev/null; then
    echo "ℹ️  LIVE mode auto_start disabled in .miyabi.yml"
    exit 0
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ LIVE mode already running (PID: $PID)"
        exit 0
    else
        # Stale PID file, remove it
        rm -f "$PID_FILE"
    fi
fi

# Start LIVE mode in background
if [ -x "$LIVE_MODE_SCRIPT" ]; then
    echo "🚀 Starting LIVE mode in background..."
    nohup "$LIVE_MODE_SCRIPT" > /dev/null 2>&1 &
    LIVE_PID=$!
    echo $LIVE_PID > "$PID_FILE"
    echo "✅ LIVE mode started (PID: $LIVE_PID)"
    echo "   To stop: kill $LIVE_PID"
    echo "   Config: $MIYABI_CONFIG"
else
    echo "❌ LIVE mode script not found or not executable: $LIVE_MODE_SCRIPT"
    exit 1
fi
