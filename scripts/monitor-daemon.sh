#!/bin/bash
# ============================================
# 🖥️ システムモニター
# 自動監視・アラート発報
# ============================================

ORCHESTRATOR_PANE="%1"
CHECK_INTERVAL=30

echo "🖥️ System Monitor Started"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "================================"

while true; do
    clear
    echo "🖥️ MIYABI SYSTEM MONITOR"
    echo "=========================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # CPU使用率
    CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}')
    echo "📊 CPU: $CPU"
    
    # メモリ使用率
    MEM=$(vm_stat | perl -ne '/Pages active:\s+(\d+)/ and print $1*4096/1073741824')
    echo "💾 Memory Active: ${MEM:.1f}GB"
    
    # ディスク
    DISK=$(df -h / | tail -1 | awk '{print $5}')
    echo "💿 Disk Usage: $DISK"
    
    # tmuxセッション
    echo ""
    echo "📦 TMUX Sessions:"
    tmux list-sessions 2>/dev/null | while read line; do
        echo "   $line"
    done
    
    # miyabi-orchestraペイン状態
    echo ""
    echo "🎼 Orchestra Panes:"
    tmux list-panes -t miyabi-orchestra:1 -F "   #{pane_id}: #{pane_title} (#{pane_current_command})" 2>/dev/null
    
    # プロセス監視
    echo ""
    echo "⚙️ Key Processes:"
    pgrep -l "node|codex|claude" 2>/dev/null | head -5 | while read line; do
        echo "   $line"
    done
    
    # アラートチェック
    echo ""
    echo "🚨 Alerts:"
    
    # CPU高負荷チェック
    CPU_NUM=$(echo $CPU | tr -d '%' | cut -d'.' -f1)
    if [[ "$CPU_NUM" -gt 80 ]]; then
        echo "   ⚠️ HIGH CPU: $CPU"
        tmux send-keys -t $ORCHESTRATOR_PANE "[MONITOR警告] CPU高負荷: $CPU" Enter
    fi
    
    # 通信途絶チェック（最後の報告から5分以上）
    LAST_REPORT=$(stat -f %m /tmp/miyabi_last_report 2>/dev/null || echo 0)
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_REPORT))
    if [[ $DIFF -gt 300 && -f /tmp/miyabi_last_report ]]; then
        echo "   ⚠️ 通信途絶警告: ${DIFF}秒間報告なし"
        tmux send-keys -t $ORCHESTRATOR_PANE "[MONITOR警告] 通信途絶: ${DIFF}秒間報告なし" Enter
    fi
    
    echo ""
    echo "================================"
    echo "Next check in ${CHECK_INTERVAL}s..."
    
    sleep $CHECK_INTERVAL
done
