#!/bin/bash
# ============================================
# 📡 コミュニケーションハブ
# 全通信監視・途絶防止・自動リカバリ
# ============================================

ORCHESTRATOR_PANE="%1"
WORKER_PANES=("%2" "%3" "%4" "%5")
WORKER_NAMES=("WORKER-1" "WORKER-2" "WORKER-3" "WORKER-4")
HEARTBEAT_INTERVAL=60
MAX_SILENCE=120  # 最大無通信時間（秒）

echo "📡 Communication Hub Started"
echo "=============================="
echo "⚠️ CRITICAL: Communication failure = Team death"
echo "Max silence allowed: ${MAX_SILENCE}s"
echo ""

# 最後の通信時刻を記録
declare -A LAST_COMM
NOW=$(date +%s)
for pane in "${WORKER_PANES[@]}"; do
    LAST_COMM[$pane]=$NOW
done

# ハートビートファイル
HEARTBEAT_FILE="/tmp/miyabi_heartbeat"
touch $HEARTBEAT_FILE

# 通信チェック
check_communication() {
    local pane=$1
    local name=$2
    
    # ペインの最新出力を確認
    local content=$(tmux capture-pane -t $pane -p 2>/dev/null | tail -3)
    local checksum=$(echo "$content" | md5 2>/dev/null || echo "$content" | md5sum | cut -d' ' -f1)
    
    # 前回のチェックサムと比較
    local prev_checksum=$(cat /tmp/miyabi_checksum_$pane 2>/dev/null)
    
    if [[ "$checksum" != "$prev_checksum" ]]; then
        # 変化あり = 通信あり
        echo "$checksum" > /tmp/miyabi_checksum_$pane
        LAST_COMM[$pane]=$(date +%s)
        return 0
    fi
    
    return 1
}

# 強制ハートビート要求
request_heartbeat() {
    local pane=$1
    local name=$2
    
    echo "💓 Requesting heartbeat from $name..."
    tmux send-keys -t $pane "echo '[HEARTBEAT] $name alive at $(date)'" Enter
    sleep 2
}

# コミュニケーション復旧
recover_communication() {
    local pane=$1
    local name=$2
    
    echo "🔧 Attempting communication recovery for $name..."
    
    # 1. まずハートビート要求
    request_heartbeat $pane $name
    sleep 3
    
    # 2. 変化確認
    if check_communication $pane $name; then
        echo "✅ $name communication restored!"
        tmux send-keys -t $ORCHESTRATOR_PANE "[COMM-HUB] $name 通信復旧" Enter
        return 0
    fi
    
    # 3. 強制インタラプト
    echo "⚠️ Sending interrupt to $name..."
    tmux send-keys -t $pane "C-c" 2>/dev/null
    sleep 2
    
    # 4. 再確認
    if check_communication $pane $name; then
        echo "✅ $name recovered after interrupt"
        return 0
    fi
    
    # 5. 最終警告
    echo "🚨 CRITICAL: $name communication failed!"
    tmux send-keys -t $ORCHESTRATOR_PANE "[COMM-HUB緊急] $name 通信断絶! 手動確認必要" Enter
    
    return 1
}

# メインループ
while true; do
    clear
    echo "📡 MIYABI COMMUNICATION HUB"
    echo "=============================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Heartbeat: ${HEARTBEAT_INTERVAL}s | Max silence: ${MAX_SILENCE}s"
    echo ""
    
    NOW=$(date +%s)
    ALL_OK=true
    
    echo "📊 Communication Status:"
    echo "------------------------------"
    
    for i in "${!WORKER_PANES[@]}"; do
        pane="${WORKER_PANES[$i]}"
        name="${WORKER_NAMES[$i]}"
        last="${LAST_COMM[$pane]}"
        silence=$((NOW - last))
        
        # 通信チェック
        if check_communication $pane $name; then
            silence=0
        fi
        
        # 状態表示
        if [[ $silence -lt 30 ]]; then
            echo "   🟢 $name: Active (${silence}s ago)"
        elif [[ $silence -lt 60 ]]; then
            echo "   🟡 $name: Quiet (${silence}s ago)"
        elif [[ $silence -lt $MAX_SILENCE ]]; then
            echo "   🟠 $name: Warning (${silence}s ago)"
            ALL_OK=false
        else
            echo "   🔴 $name: CRITICAL (${silence}s ago)"
            ALL_OK=false
            
            # 自動復旧試行
            recover_communication $pane $name
        fi
    done
    
    # オーケストレーター状態
    echo ""
    echo "🎼 Orchestrator Status:"
    echo "------------------------------"
    ORCH_CMD=$(tmux display-message -t $ORCHESTRATOR_PANE -p '#{pane_current_command}' 2>/dev/null)
    echo "   Command: $ORCH_CMD"
    
    # 全体健全性
    echo ""
    echo "📡 Hub Status:"
    echo "------------------------------"
    if $ALL_OK; then
        echo "   🟢 All communications healthy"
    else
        echo "   ⚠️ Communication issues detected"
    fi
    
    # ハートビートタイムスタンプ更新
    date +%s > $HEARTBEAT_FILE
    
    echo ""
    echo "=============================="
    echo "Next check in ${HEARTBEAT_INTERVAL}s..."
    
    sleep $HEARTBEAT_INTERVAL
done
