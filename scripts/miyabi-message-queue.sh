#!/bin/bash
# Miyabi Orchestra - Message Queue System
# ファイルベースの軽量メッセージキュー
# Agent間の自動通信を実現

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

QUEUE_DIR="${MIYABI_QUEUE_DIR:-/tmp/miyabi-orchestra/queue}"
PROCESSED_DIR="$QUEUE_DIR/processed"
LOG_FILE="${MIYABI_QUEUE_LOG:-logs/queue/message-queue.log}"

# Agent一覧
AGENTS=("conductor" "kaede" "sakura" "tsubaki" "botan")

# ============================================================================
# ログ関数
# ============================================================================

log() {
    local level=$1
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE" >&2
}

log_info() {
    log "INFO" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_debug() {
    if [[ "${MIYABI_DEBUG:-0}" == "1" ]]; then
        log "DEBUG" "$@"
    fi
}

# ============================================================================
# 初期化
# ============================================================================

init_queue() {
    log_info "Initializing message queue..."

    # ディレクトリ作成
    mkdir -p "$QUEUE_DIR" "$PROCESSED_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"

    # 各AgentのInbox作成
    for agent in "${AGENTS[@]}"; do
        touch "$QUEUE_DIR/${agent}.inbox"
        chmod 666 "$QUEUE_DIR/${agent}.inbox" 2>/dev/null || true
    done

    # ブロードキャスト用inbox
    touch "$QUEUE_DIR/broadcast.inbox"
    chmod 666 "$QUEUE_DIR/broadcast.inbox" 2>/dev/null || true

    log_info "Message queue initialized at: $QUEUE_DIR"
}

# ============================================================================
# メッセージ送信
# ============================================================================

send_message() {
    local from=$1
    local to=$2
    local type=$3
    local payload=${4:-"{}"}

    # バリデーション
    if [[ -z "$from" || -z "$to" || -z "$type" ]]; then
        log_error "send_message: Missing required parameters"
        return 1
    fi

    # メッセージID生成
    local msg_id="msg-$(date +%Y%m%d-%H%M%S)-$$-$RANDOM"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # JSONメッセージ構築
    local message
    if ! message=$(jq -n \
        --arg id "$msg_id" \
        --arg from "$from" \
        --arg to "$to" \
        --arg timestamp "$timestamp" \
        --arg type "$type" \
        --arg payload_str "$payload" \
        '{
            id: $id,
            from: $from,
            to: $to,
            timestamp: $timestamp,
            type: $type,
            payload: ($payload_str | fromjson)
        }'); then
        log_error "Failed to create JSON message"
        return 1
    fi

    # Inboxに書き込み
    local inbox="$QUEUE_DIR/${to}.inbox"

    if [[ ! -f "$inbox" ]]; then
        log_error "Inbox not found for agent: $to"
        return 1
    fi

    echo "$message" >> "$inbox"

    log_info "Message sent: $msg_id ($from → $to, type: $type)"
    log_debug "Message payload: $payload"

    return 0
}

# ============================================================================
# メッセージ受信
# ============================================================================

receive_messages() {
    local agent=$1
    local inbox="$QUEUE_DIR/${agent}.inbox"

    if [[ ! -f "$inbox" ]]; then
        log_error "Inbox not found for agent: $agent"
        return 1
    fi

    # Inboxが空の場合
    if [[ ! -s "$inbox" ]]; then
        log_debug "No messages for agent: $agent"
        return 0
    fi

    # 全メッセージを読み込み
    local messages
    messages=$(cat "$inbox")

    # Inboxをクリア
    > "$inbox"

    # メッセージをアーカイブ
    local archive_file="$PROCESSED_DIR/${agent}-$(date +%Y%m%d).log"
    echo "$messages" >> "$archive_file"

    log_info "Received $(echo "$messages" | wc -l) message(s) for agent: $agent"

    # メッセージを返す
    echo "$messages"

    return 0
}

# ============================================================================
# ブロードキャスト
# ============================================================================

broadcast_message() {
    local from=$1
    local type=$2
    local payload=${3:-"{}"}

    log_info "Broadcasting message from $from (type: $type)"

    local count=0
    for agent in "${AGENTS[@]}"; do
        # 自分自身には送信しない
        if [[ "$agent" == "$from" ]]; then
            continue
        fi

        if send_message "$from" "$agent" "$type" "$payload"; then
            count=$((count + 1))
        fi
    done

    log_info "Broadcasted to $count agent(s)"

    return 0
}

# ============================================================================
# メッセージ処理ハンドラー（サンプル実装）
# ============================================================================

process_message() {
    local agent=$1
    local message=$2

    # JSONパース
    local msg_id from type payload
    msg_id=$(echo "$message" | jq -r '.id // "unknown"')
    from=$(echo "$message" | jq -r '.from // "unknown"')
    type=$(echo "$message" | jq -r '.type // "unknown"')
    payload=$(echo "$message" | jq -r '.payload // {}')

    log_info "[$agent] Processing message $msg_id from $from (type: $type)"

    case $type in
        task_request)
            handle_task_request "$agent" "$payload"
            ;;
        task_complete)
            handle_task_complete "$agent" "$payload"
            ;;
        status_query)
            handle_status_query "$agent" "$payload"
            ;;
        ack)
            log_info "[$agent] Acknowledgment received"
            ;;
        *)
            log_error "[$agent] Unknown message type: $type"
            return 1
            ;;
    esac

    return 0
}

# ============================================================================
# タスクリクエスト処理
# ============================================================================

handle_task_request() {
    local agent=$1
    local payload=$2

    local issue
    issue=$(echo "$payload" | jq -r '.issue // "null"')

    if [[ "$issue" == "null" ]]; then
        log_error "[$agent] Task request missing issue number"
        return 1
    fi

    log_info "[$agent] Received task request for Issue #$issue"

    # tmux paneにタスクを送信
    local pane
    pane=$(get_agent_pane "$agent")

    if [[ -n "$pane" ]]; then
        # tmuxセッションが存在する場合のみ送信
        if tmux has-session -t miyabi-orchestra 2>/dev/null; then
            tmux send-keys -t "miyabi-orchestra:0.$pane" \
                "# [自動割り当て] Issue #$issue を処理します" Enter
            log_info "[$agent] Task sent to pane $pane"
        else
            log_error "[$agent] tmux session not found"
        fi
    fi

    # ACK送信
    send_message "$agent" "conductor" "ack" "{\"issue\": $issue}"

    return 0
}

# ============================================================================
# タスク完了処理
# ============================================================================

handle_task_complete() {
    local agent=$1
    local payload=$2

    local issue status
    issue=$(echo "$payload" | jq -r '.issue // "null"')
    status=$(echo "$payload" | jq -r '.status // "unknown"')

    log_info "[$agent] Task completed: Issue #$issue (status: $status)"

    # Conductorに通知
    if [[ "$agent" != "conductor" ]]; then
        send_message "$agent" "conductor" "ack" \
            "{\"issue\": $issue, \"status\": \"$status\"}"
    fi

    return 0
}

# ============================================================================
# ステータスクエリ処理
# ============================================================================

handle_status_query() {
    local agent=$1
    local payload=$2

    log_info "[$agent] Status query received"

    # ステータス情報を収集
    local status_payload
    status_payload=$(jq -n \
        --arg agent "$agent" \
        --arg status "idle" \
        '{agent: $agent, status: $status}')

    # Conductorに返信
    send_message "$agent" "conductor" "status_response" "$status_payload"

    return 0
}

# ============================================================================
# Agent名からpane番号を取得
# ============================================================================

get_agent_pane() {
    local agent=$1

    case $agent in
        kaede)   echo "1" ;;
        sakura)  echo "2" ;;
        tsubaki) echo "3" ;;
        botan)   echo "4" ;;
        conductor) echo "0" ;;
        *)       echo "" ;;
    esac
}

# ============================================================================
# Agentメッセージ処理ループ
# ============================================================================

agent_message_loop() {
    local agent=$1
    local interval=${2:-1}

    log_info "Starting message loop for agent: $agent (interval: ${interval}s)"

    while true; do
        # メッセージ受信
        local messages
        messages=$(receive_messages "$agent")

        if [[ -n "$messages" ]]; then
            # 各メッセージを処理
            while IFS= read -r msg; do
                if [[ -n "$msg" ]]; then
                    process_message "$agent" "$msg" || true
                fi
            done <<< "$messages"
        fi

        sleep "$interval"
    done
}

# ============================================================================
# ステータス表示
# ============================================================================

status() {
    echo "=== Miyabi Orchestra Message Queue Status ==="
    echo ""
    echo "Queue Directory: $QUEUE_DIR"
    echo ""

    for agent in "${AGENTS[@]}"; do
        local inbox="$QUEUE_DIR/${agent}.inbox"
        local count=0

        if [[ -f "$inbox" ]]; then
            count=$(wc -l < "$inbox")
        fi

        printf "%-12s : %3d message(s)\n" "$agent" "$count"
    done

    echo ""
    echo "Processed messages: $(ls -1 "$PROCESSED_DIR" 2>/dev/null | wc -l) file(s)"
}

# ============================================================================
# クリーンアップ
# ============================================================================

cleanup() {
    log_info "Cleaning up old processed messages..."

    # 7日より古いアーカイブを削除
    find "$PROCESSED_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true

    log_info "Cleanup completed"
}

# ============================================================================
# テスト
# ============================================================================

run_tests() {
    echo "=== Running Message Queue Tests ==="
    echo ""

    # テスト1: 初期化
    echo "Test 1: Initialization"
    init_queue
    echo "✅ PASS"
    echo ""

    # テスト2: メッセージ送信
    echo "Test 2: Send message"
    send_message "conductor" "kaede" "task_request" '{"issue": 270, "title": "Test task"}'
    echo "✅ PASS"
    echo ""

    # テスト3: メッセージ受信
    echo "Test 3: Receive message"
    local messages
    messages=$(receive_messages "kaede")

    if echo "$messages" | jq -e '.payload.issue == 270' > /dev/null; then
        echo "✅ PASS"
    else
        echo "❌ FAIL: Message content incorrect"
        return 1
    fi
    echo ""

    # テスト4: ブロードキャスト
    echo "Test 4: Broadcast message"
    broadcast_message "conductor" "status_query" '{}'

    local broadcast_count=0
    for agent in kaede sakura tsubaki botan; do
        if [[ -s "$QUEUE_DIR/${agent}.inbox" ]]; then
            ((broadcast_count++))
        fi
    done

    if [[ $broadcast_count -eq 4 ]]; then
        echo "✅ PASS: Broadcasted to $broadcast_count agents"
    else
        echo "❌ FAIL: Expected 4 agents, got $broadcast_count"
        return 1
    fi
    echo ""

    echo "=== All Tests Passed ==="
}

# ============================================================================
# メイン処理
# ============================================================================

main() {
    local command=${1:-help}

    case $command in
        init)
            init_queue
            ;;
        send)
            if [[ $# -lt 4 ]]; then
                log_error "Usage: $0 send <from> <to> <type> [payload]"
                exit 1
            fi
            local payload="${5:-"{}"}"
            send_message "$2" "$3" "$4" "$payload"
            ;;
        receive)
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 receive <agent>"
                exit 1
            fi
            receive_messages "$2"
            ;;
        broadcast)
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 broadcast <from> <type> [payload]"
                exit 1
            fi
            local payload="${4:-"{}"}"
            broadcast_message "$2" "$3" "$payload"
            ;;
        loop)
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 loop <agent> [interval]"
                exit 1
            fi
            agent_message_loop "$2" "${3:-1}"
            ;;
        status)
            status
            ;;
        cleanup)
            cleanup
            ;;
        test)
            run_tests
            ;;
        help|*)
            cat << EOF
Miyabi Orchestra - Message Queue System

Usage: $0 <command> [args...]

Commands:
  init                           - Initialize message queue
  send <from> <to> <type> [json] - Send a message
  receive <agent>                - Receive messages for an agent
  broadcast <from> <type> [json] - Broadcast message to all agents
  loop <agent> [interval]        - Start message processing loop
  status                         - Show queue status
  cleanup                        - Clean up old messages
  test                           - Run tests
  help                           - Show this help

Examples:
  $0 init
  $0 send conductor kaede task_request '{"issue": 270}'
  $0 receive kaede
  $0 broadcast conductor status_query '{}'
  $0 loop kaede 1
  $0 status

Environment Variables:
  MIYABI_QUEUE_DIR   - Queue directory (default: /tmp/miyabi-orchestra/queue)
  MIYABI_QUEUE_LOG   - Log file (default: logs/queue/message-queue.log)
  MIYABI_DEBUG       - Enable debug logging (0 or 1)
EOF
            ;;
    esac
}

# スクリプトとして実行された場合のみmainを呼ぶ
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
