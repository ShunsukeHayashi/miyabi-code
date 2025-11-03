#!/bin/bash
# Miyabi Orchestra Watchdog - tmux Pane Monitor & Auto-Recovery
# 既存のmiyabi-system-watchdog.shをベースにtmux pane監視機能を追加
# Purpose: Monitor tmux panes and auto-recover crashed agents

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

PROJECT_ROOT="${MIYABI_PROJECT_ROOT:-/home/user/miyabi-private}"
WATCHDOG_LOG="${MIYABI_WATCHDOG_LOG:-$PROJECT_ROOT/logs/watchdog/orchestra-watchdog.log}"
WATCHDOG_STATE="$PROJECT_ROOT/data/watchdog-state.json"
ALERT_LOG="$PROJECT_ROOT/logs/watchdog/critical-alerts.log"

SESSION="${MIYABI_SESSION:-miyabi-orchestra}"
CHECK_INTERVAL=${MIYABI_WATCHDOG_INTERVAL:-10}
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=30
HEARTBEAT_TIMEOUT=300  # 5分間出力がなければハング判定

# Slack Webhook（オプション）
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# ============================================================================
# Agent設定
# ============================================================================

# Agent一覧: "name:pane_index"
AGENTS=(
    "kaede:1"
    "sakura:2"
    "tsubaki:3"
    "botan:4"
)

# ============================================================================
# ログ関数
# ============================================================================

log_event() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$WATCHDOG_LOG")"

    echo "[$timestamp] [$level] [Watchdog] $message" | tee -a "$WATCHDOG_LOG" >&2
}

log_info() {
    log_event "INFO" "$@"
}

log_warning() {
    log_event "WARNING" "$@"
}

log_error() {
    log_event "ERROR" "$@"
}

log_critical() {
    log_event "CRITICAL" "$@"
}

log_recovery() {
    log_event "RECOVERY" "$@"
}

# ============================================================================
# アラート通知
# ============================================================================

send_alert() {
    local component="$1"
    local issue="$2"
    local action="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$ALERT_LOG")"

    echo "[$timestamp] [CRITICAL] Component: $component | Issue: $issue | Action: $action" | tee -a "$ALERT_LOG" >&2

    log_critical "$component FAILURE: $issue - Action: $action"

    # Slack通知（設定されている場合）
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local payload
        payload=$(jq -n \
            --arg text "🚨 Miyabi Orchestra Alert: $component - $issue ($action)" \
            '{text: $text}')

        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "$payload" 2>/dev/null || true
    fi
}

# ============================================================================
# tmux Pane監視
# ============================================================================

# Paneが存在するかチェック
is_pane_exists() {
    local pane=$1

    if tmux list-panes -t "$SESSION:0.$pane" 2>/dev/null | grep -q "^"; then
        return 0  # 存在
    else
        return 1  # 不在
    fi
}

# Paneの最終出力時刻を取得（簡易実装）
get_pane_last_activity() {
    local pane=$1
    local timestamp_file="/tmp/miyabi-watchdog/pane${pane}.timestamp"

    # タイムスタンプファイルが存在しない場合は現在時刻
    if [[ ! -f "$timestamp_file" ]]; then
        date +%s > "$timestamp_file"
    fi

    cat "$timestamp_file"
}

# Paneの出力をモニターして最終アクティビティを更新
update_pane_activity() {
    local pane=$1

    if is_pane_exists "$pane"; then
        # Paneの最新出力を取得
        local last_line
        last_line=$(tmux capture-pane -t "$SESSION:0.$pane" -p | tail -1)

        # 出力があれば時刻を更新
        if [[ -n "$last_line" ]]; then
            mkdir -p /tmp/miyabi-watchdog
            date +%s > "/tmp/miyabi-watchdog/pane${pane}.timestamp"
        fi
    fi
}

# Heartbeatチェック
is_pane_healthy() {
    local pane=$1
    local current_time=$(date +%s)
    local last_activity
    last_activity=$(get_pane_last_activity "$pane")

    local elapsed=$((current_time - last_activity))

    if [[ $elapsed -gt $HEARTBEAT_TIMEOUT ]]; then
        return 1  # タイムアウト（ハング）
    else
        return 0  # 健全
    fi
}

# ============================================================================
# Pane復旧
# ============================================================================

recreate_pane() {
    local agent_name=$1
    local pane=$2

    send_alert "Agent: $agent_name (Pane $pane)" "Pane crashed or missing" "Recreating pane"

    # 既存のpaneがあれば削除
    tmux kill-pane -t "$SESSION:0.$pane" 2>/dev/null || true

    sleep 2

    # Paneを再作成（レイアウトに応じて調整）
    # 簡易実装: split-windowで再作成
    case $pane in
        1)
            tmux split-window -t "$SESSION:0.0" -h -c "$PROJECT_ROOT"
            ;;
        2)
            tmux split-window -t "$SESSION:0.0" -v -c "$PROJECT_ROOT"
            ;;
        3)
            tmux split-window -t "$SESSION:0.1" -v -c "$PROJECT_ROOT"
            ;;
        4)
            tmux split-window -t "$SESSION:0.2" -v -c "$PROJECT_ROOT"
            ;;
    esac

    sleep 2

    # Agent初期化
    tmux send-keys -t "$SESSION:0.$pane" \
        "cd $PROJECT_ROOT && echo '[Watchdog復旧] $agent_name Agent復旧完了'" Enter

    # Message Queueループ再起動
    tmux send-keys -t "$SESSION:0.$pane" \
        "./scripts/miyabi-message-queue.sh loop $agent_name &" Enter

    sleep 2

    if is_pane_exists "$pane"; then
        log_recovery "✅ Pane $pane ($agent_name) successfully recreated"
        return 0
    else
        log_error "❌ Pane $pane ($agent_name) recreation FAILED"
        return 1
    fi
}

restart_pane_process() {
    local agent_name=$1
    local pane=$2

    send_alert "Agent: $agent_name (Pane $pane)" "Process hung (no output for ${HEARTBEAT_TIMEOUT}s)" "Restarting"

    # Ctrl-C送信してプロセス終了
    tmux send-keys -t "$SESSION:0.$pane" C-c
    sleep 1

    # Message Queueループ再起動
    tmux send-keys -t "$SESSION:0.$pane" \
        "./scripts/miyabi-message-queue.sh loop $agent_name &" Enter

    # タイムスタンプリセット
    mkdir -p /tmp/miyabi-watchdog
    date +%s > "/tmp/miyabi-watchdog/pane${pane}.timestamp"

    log_recovery "✅ Pane $pane ($agent_name) process restarted"

    return 0
}

# ============================================================================
# ステート更新
# ============================================================================

update_watchdog_state() {
    local component="$1"
    local status="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$WATCHDOG_STATE")"

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)

        if [[ -f "$WATCHDOG_STATE" ]]; then
            jq --arg comp "$component" \
               --arg status "$status" \
               --arg ts "$timestamp" \
               '.last_check = $ts | .components[$comp] = {
                   status: $status,
                   last_check: $ts,
                   checks: ((.components[$comp].checks // 0) + 1)
               }' \
               "$WATCHDOG_STATE" > "$temp_file"
        else
            echo "{\"version\":\"1.0.0\",\"last_check\":\"$timestamp\",\"components\":{}}" > "$temp_file"
        fi

        mv "$temp_file" "$WATCHDOG_STATE"
    fi
}

# ============================================================================
# メインループ
# ============================================================================

main() {
    log_info "🐕 Miyabi Orchestra Watchdog started - tmux Pane Monitor"
    log_info "📊 Session: $SESSION | Check interval: ${CHECK_INTERVAL}s"
    log_info "⏱️  Heartbeat timeout: ${HEARTBEAT_TIMEOUT}s | Max restart: $MAX_RESTART_ATTEMPTS"

    # ステート初期化
    if [[ ! -f "$WATCHDOG_STATE" ]]; then
        echo '{"version":"1.0.0","last_check":"","components":{}}' > "$WATCHDOG_STATE"
    fi

    # 失敗カウンター
    declare -A failure_counts

    for agent_info in "${AGENTS[@]}"; do
        local agent_name=${agent_info%%:*}
        failure_counts[$agent_name]=0
    done

    local iteration=0

    while true; do
        ((iteration++))

        # tmux sessionが存在するかチェック
        if ! tmux has-session -t "$SESSION" 2>/dev/null; then
            log_error "⚠️ tmux session '$SESSION' not found - waiting for session..."
            sleep "$CHECK_INTERVAL"
            continue
        fi

        # 各Agentを監視
        for agent_info in "${AGENTS[@]}"; do
            local agent_name=${agent_info%%:*}
            local pane=${agent_info#*:}

            # Pane存在チェック
            if ! is_pane_exists "$pane"; then
                ((failure_counts[$agent_name]++))
                log_warning "⚠️ Pane $pane ($agent_name) not found (failure: ${failure_counts[$agent_name]})"

                if [[ ${failure_counts[$agent_name]} -le $MAX_RESTART_ATTEMPTS ]]; then
                    recreate_pane "$agent_name" "$pane"
                    sleep "$RESTART_COOLDOWN"
                else
                    send_alert "$agent_name (Pane $pane)" "Max restart attempts exceeded" "Manual intervention required"
                fi

                update_watchdog_state "agent_${agent_name}" "FAILED"
                continue
            fi

            # Paneアクティビティ更新
            update_pane_activity "$pane"

            # Heartbeatチェック
            if ! is_pane_healthy "$pane"; then
                log_warning "⚠️ Pane $pane ($agent_name) appears hung (no output for ${HEARTBEAT_TIMEOUT}s)"

                if [[ ${failure_counts[$agent_name]} -le $MAX_RESTART_ATTEMPTS ]]; then
                    restart_pane_process "$agent_name" "$pane"
                    sleep "$RESTART_COOLDOWN"
                else
                    send_alert "$agent_name (Pane $pane)" "Process hung, max restart exceeded" "Manual intervention required"
                fi

                update_watchdog_state "agent_${agent_name}" "HUNG"
                continue
            fi

            # 正常
            failure_counts[$agent_name]=0
            update_watchdog_state "agent_${agent_name}" "RUNNING"
        done

        log_info "✅ Health check #$iteration complete - All agents OK"

        sleep "$CHECK_INTERVAL"
    done
}

# ============================================================================
# シグナルハンドラー
# ============================================================================

trap 'log_info "🛑 Watchdog shutting down gracefully"; exit 0' SIGINT SIGTERM

# ============================================================================
# メイン処理
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
