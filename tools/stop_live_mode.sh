#!/bin/bash
# Miyabi LIVE Mode Stop Script

PID_FILE="/tmp/miyabi_live/live_mode.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "ℹ️  LIVE mode is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "🛑 Stopping LIVE mode (PID: $PID)..."
    kill "$PID"
    rm -f "$PID_FILE"
    echo "✅ LIVE mode stopped"
else
    echo "ℹ️  LIVE mode process not found (stale PID file)"
    rm -f "$PID_FILE"
fi
