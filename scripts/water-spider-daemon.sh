#!/bin/bash
# ============================================
# 🕷️ ウォータースパイダー
# 問題自動検出・サポート・自動復旧
# ============================================

ORCHESTRATOR_PANE="%1"
CHECK_INTERVAL=15

echo "🕷️ Water Spider Started"
echo "Monitoring for issues..."
echo "================================"

# ワーカーペインの定義
WORKER_PANES=("%2" "%3" "%4" "%5")
WORKER_NAMES=("WORKER-1" "WORKER-2" "WORKER-3" "WORKER-4")

# 最後の活動時刻を記録
declare -A LAST_ACTIVITY

for pane in "${WORKER_PANES[@]}"; do
    LAST_ACTIVITY[$pane]=$(date +%s)
done

check_worker_health() {
    local pane=$1
    local name=$2
    
    # ペインの現在のコマンドを確認
    local cmd=$(tmux display-message -t $pane -p '#{pane_current_command}' 2>/dev/null)
    
    # ペインの内容を確認（最後の5行）
    local content=$(tmux capture-pane -t $pane -p 2>/dev/null | tail -5)
    
    # エラー検出
    if echo "$content" | grep -qi "error\|failed\|exception\|panic"; then
        echo "🚨 [$name] エラー検出!"
        tmux send-keys -t $ORCHESTRATOR_PANE "[SPIDER警告] $name にエラー検出" Enter
        return 1
    fi
    
    # スタック検出（同じ内容が続いている）
    # APIエラー検出
    if echo "$content" | grep -qi "API Error\|timeout\|connection refused"; then
        echo "⚠️ [$name] API/接続問題検出"
        tmux send-keys -t $ORCHESTRATOR_PANE "[SPIDER警告] $name に接続問題" Enter
        return 2
    fi
    
    return 0
}

auto_recover() {
    local pane=$1
    local name=$2
    local issue_type=$3
    
    echo "🔧 [$name] 自動復旧を試みます..."
    
    case $issue_type in
        1) # エラー
            # Escキーを送信してインタラプト
            tmux send-keys -t $pane "C-c" 2>/dev/null
            sleep 1
            echo "   Interrupted, waiting for recovery..."
            ;;
        2) # 接続問題
            # next を送信して次へ進む
            tmux send-keys -t $pane "next" Enter 2>/dev/null
            echo "   Sent 'next' command"
            ;;
    esac
    
    tmux send-keys -t $ORCHESTRATOR_PANE "[SPIDER復旧] $name に復旧処理を実行" Enter
}

while true; do
    echo ""
    echo "🕷️ Scan: $(date '+%H:%M:%S')"
    echo "------------------------"
    
    for i in "${!WORKER_PANES[@]}"; do
        pane="${WORKER_PANES[$i]}"
        name="${WORKER_NAMES[$i]}"
        
        check_worker_health "$pane" "$name"
        result=$?
        
        if [[ $result -eq 0 ]]; then
            echo "✅ $name: OK"
            LAST_ACTIVITY[$pane]=$(date +%s)
        else
            echo "⚠️ $name: Issue detected (code: $result)"
            auto_recover "$pane" "$name" $result
        fi
    done
    
    # 長時間無活動チェック
    NOW=$(date +%s)
    for i in "${!WORKER_PANES[@]}"; do
        pane="${WORKER_PANES[$i]}"
        name="${WORKER_NAMES[$i]}"
        last="${LAST_ACTIVITY[$pane]}"
        diff=$((NOW - last))
        
        if [[ $diff -gt 180 ]]; then
            echo "⏰ $name: ${diff}秒間無活動"
        fi
    done
    
    # 報告タイムスタンプ更新
    touch /tmp/miyabi_last_report
    
    sleep $CHECK_INTERVAL
done
