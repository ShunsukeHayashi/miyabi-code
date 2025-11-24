#!/bin/bash
# ============================================
# 📍 トラッキングダッシュボード
# 進捗追跡・報告履歴管理
# ============================================

LOG_FILE="/tmp/miyabi_tracking.log"
ORCHESTRATOR_PANE="%1"
REFRESH_INTERVAL=10

echo "📍 Tracking Dashboard Started"
echo "================================"

# ログファイル初期化
touch $LOG_FILE

# オーケストレーターペインを監視して報告を抽出
monitor_reports() {
    tmux capture-pane -t $ORCHESTRATOR_PANE -p 2>/dev/null | \
        grep -E "\[WORKER-[0-9]|ORCHESTRATOR" | \
        tail -20
}

while true; do
    clear
    echo "📍 MIYABI TRACKING DASHBOARD"
    echo "=============================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 最新の報告を表示
    echo "📋 Recent Reports (Last 20):"
    echo "------------------------------"
    monitor_reports
    
    echo ""
    echo "📊 Statistics:"
    echo "------------------------------"
    
    # 各ワーカーの報告数をカウント
    REPORTS=$(tmux capture-pane -t $ORCHESTRATOR_PANE -p 2>/dev/null)
    
    W1=$(echo "$REPORTS" | grep -c "\[WORKER-1" || echo 0)
    W2=$(echo "$REPORTS" | grep -c "\[WORKER-2" || echo 0)
    W3=$(echo "$REPORTS" | grep -c "\[WORKER-3" || echo 0)
    W4=$(echo "$REPORTS" | grep -c "\[WORKER-4" || echo 0)
    
    echo "   WORKER-1: $W1 reports"
    echo "   WORKER-2: $W2 reports"
    echo "   WORKER-3: $W3 reports"
    echo "   WORKER-4: $W4 reports"
    
    TOTAL=$((W1 + W2 + W3 + W4))
    echo ""
    echo "   Total: $TOTAL reports"
    
    # 報告の種類別カウント
    echo ""
    echo "📈 Report Types:"
    echo "------------------------------"
    STARTS=$(echo "$REPORTS" | grep -c "開始\|Start" || echo 0)
    PROGRESS=$(echo "$REPORTS" | grep -c "進捗\|Progress" || echo 0)
    COMPLETES=$(echo "$REPORTS" | grep -c "完了\|Complete" || echo 0)
    BLOCKS=$(echo "$REPORTS" | grep -c "ブロック\|Block" || echo 0)
    WARNINGS=$(echo "$REPORTS" | grep -c "警告\|Warning" || echo 0)
    
    echo "   🟢 Starts: $STARTS"
    echo "   🔵 Progress: $PROGRESS"
    echo "   ✅ Completes: $COMPLETES"
    echo "   🔴 Blocks: $BLOCKS"
    echo "   ⚠️ Warnings: $WARNINGS"
    
    # 健全性スコア
    echo ""
    echo "💯 Health Score:"
    echo "------------------------------"
    if [[ $TOTAL -gt 0 ]]; then
        HEALTH=$((100 - (BLOCKS * 10) - (WARNINGS * 5)))
        [[ $HEALTH -lt 0 ]] && HEALTH=0
        echo "   Score: $HEALTH%"
        
        if [[ $HEALTH -ge 80 ]]; then
            echo "   Status: 🟢 EXCELLENT"
        elif [[ $HEALTH -ge 60 ]]; then
            echo "   Status: 🟡 GOOD"
        elif [[ $HEALTH -ge 40 ]]; then
            echo "   Status: 🟠 WARNING"
        else
            echo "   Status: 🔴 CRITICAL"
        fi
    else
        echo "   Waiting for reports..."
    fi
    
    echo ""
    echo "=============================="
    echo "Refresh in ${REFRESH_INTERVAL}s..."
    
    sleep $REFRESH_INTERVAL
done
