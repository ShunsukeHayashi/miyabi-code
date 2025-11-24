#!/bin/bash
# ============================================
# 📋 タスクキューマネージャー
# タスク管理・自動割り当て
# ============================================

QUEUE_FILE="/tmp/miyabi_task_queue.json"
ORCHESTRATOR_PANE="%1"
WORKER_PANES=("%2" "%3" "%4" "%5")
WORKER_NAMES=("WORKER-1" "WORKER-2" "WORKER-3" "WORKER-4")
REFRESH_INTERVAL=5

echo "📋 Task Queue Manager Started"
echo "================================"

# キューファイル初期化
if [[ ! -f $QUEUE_FILE ]]; then
    echo '{"pending":[],"in_progress":[],"completed":[]}' > $QUEUE_FILE
fi

# タスク追加関数
add_task() {
    local task="$1"
    local priority="${2:-normal}"
    echo "Adding task: $task (priority: $priority)"
    # JSONに追加（簡易実装）
    echo "$task" >> /tmp/miyabi_pending_tasks.txt
}

# ワーカーのビジー状態確認
is_worker_busy() {
    local pane=$1
    local cmd=$(tmux display-message -t $pane -p '#{pane_current_command}' 2>/dev/null)
    if [[ "$cmd" == "node" ]]; then
        return 0  # busy
    else
        return 1  # idle
    fi
}

# アイドルワーカーを探す
find_idle_worker() {
    for i in "${!WORKER_PANES[@]}"; do
        if ! is_worker_busy "${WORKER_PANES[$i]}"; then
            echo $i
            return
        fi
    done
    echo "-1"
}

# タスク割り当て
assign_task() {
    local task="$1"
    local worker_idx=$(find_idle_worker)
    
    if [[ "$worker_idx" != "-1" ]]; then
        local pane="${WORKER_PANES[$worker_idx]}"
        local name="${WORKER_NAMES[$worker_idx]}"
        
        echo "📤 Assigning to $name: $task"
        tmux send-keys -t $pane "$task" Enter
        tmux send-keys -t $ORCHESTRATOR_PANE "[QUEUE] $task を $name に割り当て" Enter
        return 0
    else
        echo "⏳ All workers busy, queuing..."
        return 1
    fi
}

while true; do
    clear
    echo "📋 MIYABI TASK QUEUE MANAGER"
    echo "=============================="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # ワーカー状態表示
    echo "👥 Worker Status:"
    echo "------------------------------"
    for i in "${!WORKER_PANES[@]}"; do
        pane="${WORKER_PANES[$i]}"
        name="${WORKER_NAMES[$i]}"
        cmd=$(tmux display-message -t $pane -p '#{pane_current_command}' 2>/dev/null)
        
        if [[ "$cmd" == "node" ]]; then
            echo "   🔵 $name: BUSY ($cmd)"
        else
            echo "   🟢 $name: IDLE"
        fi
    done
    
    # 保留タスク表示
    echo ""
    echo "📥 Pending Tasks:"
    echo "------------------------------"
    if [[ -f /tmp/miyabi_pending_tasks.txt ]]; then
        cat /tmp/miyabi_pending_tasks.txt 2>/dev/null | head -10 | nl
        PENDING=$(wc -l < /tmp/miyabi_pending_tasks.txt 2>/dev/null || echo 0)
        echo ""
        echo "   Total pending: $PENDING"
    else
        echo "   (empty)"
    fi
    
    # 自動割り当て試行
    if [[ -f /tmp/miyabi_pending_tasks.txt && -s /tmp/miyabi_pending_tasks.txt ]]; then
        FIRST_TASK=$(head -1 /tmp/miyabi_pending_tasks.txt)
        IDLE_WORKER=$(find_idle_worker)
        
        if [[ "$IDLE_WORKER" != "-1" && -n "$FIRST_TASK" ]]; then
            echo ""
            echo "🔄 Auto-assigning task..."
            assign_task "$FIRST_TASK"
            # タスクをキューから削除
            sed -i '' '1d' /tmp/miyabi_pending_tasks.txt 2>/dev/null
        fi
    fi
    
    echo ""
    echo "=============================="
    echo "Commands:"
    echo "  Add task: echo 'task' >> /tmp/miyabi_pending_tasks.txt"
    echo ""
    echo "Refresh in ${REFRESH_INTERVAL}s..."
    
    sleep $REFRESH_INTERVAL
done
