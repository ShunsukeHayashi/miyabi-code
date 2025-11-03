#!/bin/bash
# Miyabi Orchestra - Auto-refresh monitor
# 2秒ごとに自動更新

cd /home/user/miyabi-private

while true; do
    ./scripts/miyabi-monitor.sh
    echo ""
    echo "🔄 自動更新中... (Ctrl+C で停止)"
    echo "次回更新: 2秒後"
    sleep 2
    clear
done
