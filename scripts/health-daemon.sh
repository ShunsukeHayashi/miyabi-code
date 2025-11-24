#!/bin/bash
# ============================================
# 💓 ヘルスチェックデーモン
# 全システム健全性監視・自動復旧
# ============================================

CHECK_INTERVAL=20
ORCHESTRATOR_PANE="%1"

echo "💓 Health Check Daemon Started"
echo "=============================="

# 各デーモンの状態確認
check_daemon() {
    local name=$1
    local pattern=$2
    
    if pgrep -f "$pattern" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# デーモン再起動
restart_daemon() {
    local name=$1
    local script=$2
    local window=$3
    
    echo "🔄 Restarting $name..."
    tmux send-keys -t "miyabi-orchestra:$window" "bash $script" Enter
    echo "✅ $name restarted"
}

while true; do
    clear
    echo "💓 MIYABI HEALTH CHECK"
    echo "=============================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # システムリソース
    echo "💻 System Resources:"
    echo "------------------------------"
    
    # Load average
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    echo "   Load: $LOAD"
    
    # メモリ
    MEM_PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide" | head -1 || echo "N/A")
    echo "   Memory: $MEM_PRESSURE"
    
    # プロセス数
    PROCS=$(ps aux | wc -l)
    echo "   Processes: $PROCS"
    
    # tmuxセッション健全性
    echo ""
    echo "📦 TMUX Health:"
    echo "------------------------------"
    
    SESSIONS=$(tmux list-sessions 2>/dev/null | wc -l)
    echo "   Active sessions: $SESSIONS"
    
    if tmux has-session -t miyabi-orchestra 2>/dev/null; then
        echo "   ✅ miyabi-orchestra: Running"
        WINDOWS=$(tmux list-windows -t miyabi-orchestra 2>/dev/null | wc -l)
        echo "      Windows: $WINDOWS"
        PANES=$(tmux list-panes -t miyabi-orchestra -a 2>/dev/null | wc -l)
        echo "      Total panes: $PANES"
    else
        echo "   🔴 miyabi-orchestra: NOT RUNNING!"
        tmux send-keys -t $ORCHESTRATOR_PANE "[HEALTH緊急] miyabi-orchestraセッション異常" Enter
    fi
    
    # デーモン状態
    echo ""
    echo "🤖 Daemon Status:"
    echo "------------------------------"
    
    DAEMONS=(
        "monitor-daemon:🖥️ Monitor"
        "water-spider-daemon:🕷️ Water Spider"
        "tracking-daemon:📍 Tracking"
        "task-queue-daemon:📋 Task Queue"
        "comm-hub-daemon:📡 Comm Hub"
    )
    
    for daemon_info in "${DAEMONS[@]}"; do
        IFS=':' read -r pattern name <<< "$daemon_info"
        if pgrep -f "$pattern" > /dev/null 2>&1; then
            echo "   ✅ $name: Running"
        else
            echo "   ⚠️ $name: Not running"
        fi
    done
    
    # Git状態
    echo ""
    echo "🌿 Git Status:"
    echo "------------------------------"
    cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
    BRANCH=$(git branch --show-current 2>/dev/null)
    echo "   Branch: $BRANCH"
    CHANGES=$(git status --porcelain 2>/dev/null | wc -l | xargs)
    echo "   Uncommitted changes: $CHANGES"
    
    # MCP サーバー状態
    echo ""
    echo "🔌 MCP Servers:"
    echo "------------------------------"
    MCP_PROCS=$(pgrep -f "miyabi.*server\|mcp.*server" 2>/dev/null | wc -l)
    echo "   Active MCP processes: $MCP_PROCS"
    
    # 総合判定
    echo ""
    echo "💯 Overall Health:"
    echo "------------------------------"
    
    ISSUES=0
    [[ $SESSIONS -lt 1 ]] && ((ISSUES++))
    [[ $WINDOWS -lt 5 ]] && ((ISSUES++))
    
    if [[ $ISSUES -eq 0 ]]; then
        echo "   🟢 HEALTHY - All systems operational"
    elif [[ $ISSUES -lt 3 ]]; then
        echo "   🟡 DEGRADED - $ISSUES issues detected"
    else
        echo "   🔴 CRITICAL - $ISSUES issues detected"
        tmux send-keys -t $ORCHESTRATOR_PANE "[HEALTH警告] システム異常検出: $ISSUES件" Enter
    fi
    
    echo ""
    echo "=============================="
    echo "Next check in ${CHECK_INTERVAL}s..."
    
    sleep $CHECK_INTERVAL
done
