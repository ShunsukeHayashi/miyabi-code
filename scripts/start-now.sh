#!/bin/bash
# Quick fix: Start dev server now
cd /home/ubuntu/miyabi-private/crates/miyabi-console
npm install 2>/dev/null
nohup npm run dev > /tmp/console-dev.log 2>&1 &
echo "Dev server started. Check: tail -f /tmp/console-dev.log"
