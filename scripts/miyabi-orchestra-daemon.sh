#!/bin/bash
# Miyabi Orchestra - Daemon Startup Script
# Purpose: Start/stop all components for autonomous operation

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SESSION="${MIYABI_SESSION:-miyabi-orchestra}"
PIDFILE="/var/run/miyabi-orchestra.pid"

# ============================================================================
# ログ関数
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# ============================================================================
# Agent名取得
# ============================================================================

get_agent_name() {
    case $1 in
        1) echo "kaede" ;;
        2) echo "sakura" ;;
        3) echo "tsubaki" ;;
        4) echo "botan" ;;
        *) echo "unknown" ;;
    esac
}

# ============================================================================
# 起動
# ============================================================================

start_daemon() {
    log "Starting Miyabi Orchestra..."

    cd "$PROJECT_ROOT" || exit 1

    # 既存セッションがあれば終了
    if tmux has-session -t "$SESSION" 2>/dev/null; then
        log "Existing session found, stopping..."
        tmux kill-session -t "$SESSION" 2>/dev/null || true
        sleep 2
    fi

    # 1. Message Queue初期化
    log "Initializing Message Queue..."
    "$SCRIPT_DIR/miyabi-message-queue.sh" init

    # 2. tmuxセッション作成 & Orchestra起動
    log "Creating tmux session..."
    tmux new-session -d -s "$SESSION" -c "$PROJECT_ROOT"

    # Orchestraスクリプトを直接実行してpaneを作成
    log "Setting up Orchestra panes..."

    # Pane 1: カエデ (CodeGen)
    tmux split-window -t "$SESSION:0.0" -h -c "$PROJECT_ROOT"
    tmux send-keys -t "$SESSION:0.1" \
        "cd $PROJECT_ROOT && echo '[カエデ] CodeGenAgent起動中...'" Enter

    # Pane 2: サクラ (Review)
    tmux split-window -t "$SESSION:0.0" -v -c "$PROJECT_ROOT"
    tmux send-keys -t "$SESSION:0.2" \
        "cd $PROJECT_ROOT && echo '[サクラ] ReviewAgent起動中...'" Enter

    # Pane 3: ツバキ (PR)
    tmux split-window -t "$SESSION:0.1" -v -c "$PROJECT_ROOT"
    tmux send-keys -t "$SESSION:0.3" \
        "cd $PROJECT_ROOT && echo '[ツバキ] PRAgent起動中...'" Enter

    # Pane 4: ボタン (Deployment)
    tmux split-window -t "$SESSION:0.2" -v -c "$PROJECT_ROOT"
    tmux send-keys -t "$SESSION:0.4" \
        "cd $PROJECT_ROOT && echo '[ボタン] DeploymentAgent起動中...'" Enter

    sleep 2

    # 3. 各AgentのMessage Queueループ起動
    log "Starting Message Queue loops for each agent..."

    for pane in 1 2 3 4; do
        agent=$(get_agent_name "$pane")
        log "  Starting Message Queue loop for $agent (pane $pane)"

        tmux send-keys -t "$SESSION:0.$pane" \
            "cd $PROJECT_ROOT && ./scripts/miyabi-message-queue.sh loop $agent > logs/queue/$agent-loop.log 2>&1 &" Enter

        sleep 1
    done

    # 4. Task Scheduler起動（バックグラウンド）
    log "Starting Task Scheduler..."

    nohup "$SCRIPT_DIR/miyabi-task-scheduler.sh" start \
        > logs/scheduler/nohup.out 2>&1 &

    echo $! > "$PIDFILE.scheduler"

    log "  Task Scheduler started (PID: $(cat "$PIDFILE.scheduler"))"

    # 5. Watchdog起動（バックグラウンド）
    log "Starting Watchdog..."

    nohup "$SCRIPT_DIR/miyabi-orchestra-watchdog.sh" \
        > logs/watchdog/nohup.out 2>&1 &

    echo $! > "$PIDFILE.watchdog"

    log "  Watchdog started (PID: $(cat "$PIDFILE.watchdog"))"

    # PIDファイル作成（tmux session PID）
    tmux list-sessions -F "#{session_name} #{pid}" | \
        grep "$SESSION" | awk '{print $2}' > "$PIDFILE"

    log "Miyabi Orchestra started successfully"
    log "  Session: $SESSION"
    log "  PID: $(cat "$PIDFILE" 2>/dev/null || echo 'N/A')"
    log "  Scheduler PID: $(cat "$PIDFILE.scheduler" 2>/dev/null || echo 'N/A')"
    log "  Watchdog PID: $(cat "$PIDFILE.watchdog" 2>/dev/null || echo 'N/A')"

    return 0
}

# ============================================================================
# 停止
# ============================================================================

stop_daemon() {
    log "Stopping Miyabi Orchestra..."

    # Task Scheduler停止
    if [[ -f "$PIDFILE.scheduler" ]]; then
        local scheduler_pid
        scheduler_pid=$(cat "$PIDFILE.scheduler")
        log "  Stopping Task Scheduler (PID: $scheduler_pid)..."

        kill "$scheduler_pid" 2>/dev/null || true
        rm -f "$PIDFILE.scheduler"
    fi

    # Watchdog停止
    if [[ -f "$PIDFILE.watchdog" ]]; then
        local watchdog_pid
        watchdog_pid=$(cat "$PIDFILE.watchdog")
        log "  Stopping Watchdog (PID: $watchdog_pid)..."

        kill "$watchdog_pid" 2>/dev/null || true
        rm -f "$PIDFILE.watchdog"
    fi

    # tmuxセッション停止
    if tmux has-session -t "$SESSION" 2>/dev/null; then
        log "  Stopping tmux session..."
        tmux kill-session -t "$SESSION" 2>/dev/null || true
    fi

    rm -f "$PIDFILE"

    log "Miyabi Orchestra stopped"

    return 0
}

# ============================================================================
# ステータス確認
# ============================================================================

show_status() {
    echo "=== Miyabi Orchestra Status ==="
    echo ""

    # tmuxセッション
    if tmux has-session -t "$SESSION" 2>/dev/null; then
        echo "✅ tmux session: RUNNING"
        echo "   Panes:"
        tmux list-panes -t "$SESSION:0" -F "     Pane #{pane_index}: #{pane_id} (#{pane_width}x#{pane_height})"
    else
        echo "❌ tmux session: NOT RUNNING"
    fi

    echo ""

    # Task Scheduler
    if [[ -f "$PIDFILE.scheduler" ]]; then
        local pid
        pid=$(cat "$PIDFILE.scheduler")

        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ Task Scheduler: RUNNING (PID: $pid)"
        else
            echo "❌ Task Scheduler: NOT RUNNING (stale PID file)"
        fi
    else
        echo "❌ Task Scheduler: NOT RUNNING"
    fi

    echo ""

    # Watchdog
    if [[ -f "$PIDFILE.watchdog" ]]; then
        local pid
        pid=$(cat "$PIDFILE.watchdog")

        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ Watchdog: RUNNING (PID: $pid)"
        else
            echo "❌ Watchdog: NOT RUNNING (stale PID file)"
        fi
    else
        echo "❌ Watchdog: NOT RUNNING"
    fi

    echo ""

    # Message Queue状態
    if [[ -x "$SCRIPT_DIR/miyabi-message-queue.sh" ]]; then
        "$SCRIPT_DIR/miyabi-message-queue.sh" status
    fi
}

# ============================================================================
# メイン処理
# ============================================================================

main() {
    local command=${1:-help}

    # ディレクトリ作成
    mkdir -p logs/{scheduler,watchdog,queue,systemd}
    mkdir -p data

    case $command in
        start)
            start_daemon
            ;;
        stop)
            stop_daemon
            ;;
        restart)
            stop_daemon
            sleep 3
            start_daemon
            ;;
        status)
            show_status
            ;;
        *)
            cat << EOF
Miyabi Orchestra - Daemon Control Script

Usage: $0 {start|stop|restart|status}

Commands:
  start    - Start Miyabi Orchestra daemon
  stop     - Stop Miyabi Orchestra daemon
  restart  - Restart Miyabi Orchestra daemon
  status   - Show status of all components

Examples:
  $0 start
  $0 status
  $0 restart
EOF
            exit 1
            ;;
    esac
}

# スクリプトとして実行された場合のみmainを呼ぶ
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
