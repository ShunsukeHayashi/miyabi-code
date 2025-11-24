#!/bin/bash
# ============================================
# 🎼 Miyabi Orchestra Hooks
# Version: 1.0.0
# Date: 2025-11-22
# ============================================
# Usage: source this file in .bashrc or .zshrc
#   source ~/.miyabi_hooks.sh
# ============================================

# 現在のワーカーIDを取得
get_worker_id() {
    local pane_id=$(tmux display-message -p '#{pane_id}' 2>/dev/null)
    case "$pane_id" in
        "%1") echo "ORCHESTRATOR" ;;
        "%2") echo "WORKER-1" ;;
        "%3") echo "WORKER-2" ;;
        "%4") echo "WORKER-3" ;;
        "%5") echo "WORKER-4" ;;
        *) echo "UNKNOWN-$pane_id" ;;
    esac
}

# ============================================
# SESSION END HOOK (P0: 必須報告)
# ============================================
miyabi_session_end_report() {
    local worker_id=$(get_worker_id)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # オーケストレーター以外はPUSH報告必須
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "📤 [$worker_id] Session End Report..."
        
        # オーケストレーターに報告を送信
        tmux send-keys -t %1 "[$worker_id セッション終了] $timestamp - セッションを終了します" Enter
        
        sleep 0.5
        echo "✅ Report sent to ORCHESTRATOR"
    else
        echo "🎼 [ORCHESTRATOR] Session End - Collecting final reports..."
    fi
}

# ============================================
# SESSION START HOOK
# ============================================
miyabi_session_start_notify() {
    local worker_id=$(get_worker_id)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "📥 [$worker_id] Session Start Notify..."
        
        # オーケストレーターに開始を通知
        tmux send-keys -t %1 "[$worker_id セッション開始] $timestamp - 稼働開始しました" Enter
        
        sleep 0.5
        echo "✅ Start notification sent to ORCHESTRATOR"
    else
        echo "🎼 [ORCHESTRATOR] Session Start - Ready to receive reports"
    fi
}

# ============================================
# TASK COMPLETION HOOK (作業完了時)
# ============================================
miyabi_task_complete() {
    local task_name="$1"
    local result="$2"
    local worker_id=$(get_worker_id)
    
    if [[ -z "$task_name" ]]; then
        echo "Usage: miyabi_task_complete 'タスク名' '結果'"
        return 1
    fi
    
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "📤 [$worker_id] Task Complete Report..."
        tmux send-keys -t %1 "[$worker_id 完了] $task_name: ${result:-完了}" Enter
        sleep 0.5
        echo "✅ Task completion reported"
    fi
}

# ============================================
# TASK START HOOK (作業開始時)
# ============================================
miyabi_task_start() {
    local task_name="$1"
    local worker_id=$(get_worker_id)
    
    if [[ -z "$task_name" ]]; then
        echo "Usage: miyabi_task_start 'タスク名'"
        return 1
    fi
    
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "📤 [$worker_id] Task Start Report..."
        tmux send-keys -t %1 "[$worker_id 開始] $task_name を受領" Enter
        sleep 0.5
        echo "✅ Task start reported"
    fi
}

# ============================================
# PROGRESS REPORT HOOK (進捗報告)
# ============================================
miyabi_progress() {
    local progress="$1"
    local details="$2"
    local worker_id=$(get_worker_id)
    
    if [[ -z "$progress" ]]; then
        echo "Usage: miyabi_progress '50%' '詳細'"
        return 1
    fi
    
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "📤 [$worker_id] Progress Report..."
        tmux send-keys -t %1 "[$worker_id 進捗] $progress ${details:+- $details}" Enter
        sleep 0.5
        echo "✅ Progress reported"
    fi
}

# ============================================
# BLOCK REPORT HOOK (ブロック報告)
# ============================================
miyabi_blocked() {
    local reason="$1"
    local suggestion="$2"
    local worker_id=$(get_worker_id)
    
    if [[ -z "$reason" ]]; then
        echo "Usage: miyabi_blocked '理由' '対応案'"
        return 1
    fi
    
    if [[ "$worker_id" != "ORCHESTRATOR" ]]; then
        echo "🚨 [$worker_id] Block Report..."
        tmux send-keys -t %1 "[$worker_id ブロック] $reason ${suggestion:+| 対応案: $suggestion}" Enter
        sleep 0.5
        echo "⚠️ Block reported to ORCHESTRATOR"
    fi
}

# ============================================
# エイリアス設定
# ============================================
alias mtc='miyabi_task_complete'
alias mts='miyabi_task_start'
alias mpr='miyabi_progress'
alias mbl='miyabi_blocked'
alias mse='miyabi_session_end_report'
alias mss='miyabi_session_start_notify'

echo "🎼 Miyabi Orchestra Hooks loaded"
echo "   Commands: miyabi_task_start, miyabi_task_complete, miyabi_progress, miyabi_blocked"
echo "   Aliases: mts, mtc, mpr, mbl, mse, mss"
