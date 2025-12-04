#!/bin/bash
# Miyabi Dev Server Auto-Start
# This script is designed to be run via cron or systemd

MIYABI_ROOT="/home/ubuntu/miyabi-private"
LOG_FILE="$MIYABI_ROOT/logs/dev-server.log"

mkdir -p "$MIYABI_ROOT/logs"

echo "[$(date)] Starting Miyabi Console Dev Server..." >> "$LOG_FILE"

cd "$MIYABI_ROOT/crates/miyabi-console"

# Install if needed
if [ ! -d "node_modules" ]; then
    echo "[$(date)] Installing dependencies..." >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1
fi

# Start Vite in background
echo "[$(date)] Starting Vite dev server on port 5173..." >> "$LOG_FILE"
nohup npm run dev >> "$LOG_FILE" 2>&1 &

echo "[$(date)] Dev server started with PID: $!" >> "$LOG_FILE"
