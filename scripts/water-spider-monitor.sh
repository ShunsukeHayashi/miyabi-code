#!/bin/bash
# Miyabi Orchestra - Water Spider Agent Monitoring Script
# Version: 1.0.0
# Purpose: Monitor all agents and auto-recovery

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
CONDUCTOR_PANE="%1"
LOG_FILE="$WORKING_DIR/.ai/logs/water-spider.log"

# Agent定義
declare -A AGENTS=(
    ["%2"]="カエデ"
    ["%5"]="サクラ"
    ["%3"]="ツバキ"
    ["%4"]="ボタン"
)

# 設定
PING_TIMEOUT=30
CHECK_INTERVAL=60
RECOVERY_ATTEMPTS=3

# ログ関数
log_message() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

# Conductorに報告
report_to_conductor() {
    local message="$1"
    if tmux list-panes -F '#{pane_id}' | grep -q "^${CONDUCTOR_PANE}$"; then
        tmux send-keys -t "$CONDUCTOR_PANE" "$message" && sleep 0.5 && tmux send-keys -t "$CONDUCTOR_PANE" Enter
    fi
}

# pingメッセージ送信
send_ping() {
    local pane_id="$1"
    local agent_name="$2"
    local ping_message="cd '$WORKING_DIR' && [$agent_name] ping応答OK と発言してください。（30秒以内）"

    tmux send-keys -t "$pane_id" "$ping_message" && sleep 0.5 && tmux send-keys -t "$pane_id" Enter
    log_message "[Water Spider] 🏓 ${agent_name}にping送信"
}

# 応答確認
check_response() {
    local pane_id="$1"
    local agent_name="$2"
    local timeout=$PING_TIMEOUT
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        local output=$(tmux capture-pane -t "$pane_id" -p | tail -10)

        if echo "$output" | grep -q "ping応答OK"; then
            log_message "[Water Spider] ✅ ${agent_name}応答確認"
            return 0
        fi

        sleep 5
        elapsed=$((elapsed + 5))
    done

    log_message "[Water Spider] ⚠️ ${agent_name}応答なし（${timeout}秒経過）"
    return 1
}

# セッション生存確認
check_session_alive() {
    local pane_id="$1"
    local agent_name="$2"

    # pane存在確認
    if ! tmux list-panes -F '#{pane_id}' | grep -q "^${pane_id}$"; then
        log_message "[Water Spider] ❌ ${agent_name}のpaneが存在しません"
        return 1
    fi

    # Claude Code起動確認
    local output=$(tmux capture-pane -t "$pane_id" -p | tail -5)
    if echo "$output" | grep -q "bypass permissions"; then
        return 0
    else
        log_message "[Water Spider] ⚠️ ${agent_name}のClaude Codeセッション異常"
        return 1
    fi
}

# 自動復旧
auto_recovery() {
    local pane_id="$1"
    local agent_name="$2"
    local attempts=$RECOVERY_ATTEMPTS

    log_message "[Water Spider] 🔧 ${agent_name}復旧開始（最大${attempts}回試行）"
    report_to_conductor "[Water Spider] ⚠️ ${agent_name}が応答なし - 復旧開始"

    for ((i=1; i<=attempts; i++)); do
        log_message "[Water Spider] 🔄 ${agent_name}復旧試行 #${i}"

        # /clear送信
        tmux send-keys -t "$pane_id" "cd '$WORKING_DIR' && /clear" && sleep 0.5 && tmux send-keys -t "$pane_id" Enter
        sleep 5

        # セッション確認
        if check_session_alive "$pane_id" "$agent_name"; then
            # 再度ping
            send_ping "$pane_id" "$agent_name"
            sleep 5

            if check_response "$pane_id" "$agent_name"; then
                log_message "[Water Spider] ✅ ${agent_name}復旧成功（試行回数: ${i}）"
                report_to_conductor "[Water Spider] ✅ ${agent_name}復旧完了"
                return 0
            fi
        fi

        log_message "[Water Spider] ⚠️ ${agent_name}復旧試行 #${i} 失敗"
        sleep 3
    done

    log_message "[Water Spider] ❌ ${agent_name}復旧失敗（${attempts}回試行）"
    report_to_conductor "[Water Spider] ❌ ${agent_name}復旧失敗 - 手動介入必要"
    return 1
}

# ステータスダッシュボード生成
generate_dashboard() {
    local cycle="$1"

    clear
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🕷️  Miyabi Orchestra - Water Spider Monitoring Dashboard"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Monitoring Cycle: #${cycle}"
    echo "⏰ Last Update: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "┌──────────────────────────────────────────────────┐"
    echo "│ Agent Status                                      │"
    echo "├──────────────────────────────────────────────────┤"

    for pane_id in "${!AGENTS[@]}"; do
        agent_name="${AGENTS[$pane_id]}"

        # pane存在確認
        if ! tmux list-panes -F '#{pane_id}' | grep -q "^${pane_id}$"; then
            printf "│ %-20s [❌ OFFLINE]                   │\n" "$agent_name ($pane_id)"
            continue
        fi

        # セッション確認
        if check_session_alive "$pane_id" "$agent_name"; then
            printf "│ %-20s [✅ ONLINE]                    │\n" "$agent_name ($pane_id)"
        else
            printf "│ %-20s [⚠️  WARNING]                  │\n" "$agent_name ($pane_id)"
        fi
    done

    echo "└──────────────────────────────────────────────────┘"
    echo ""
    echo "📈 Statistics:"
    echo "  - Check Interval: ${CHECK_INTERVAL}s"
    echo "  - Ping Timeout: ${PING_TIMEOUT}s"
    echo "  - Recovery Attempts: ${RECOVERY_ATTEMPTS}"
    echo ""
    echo "🔔 Recent Events (from log):"
    tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# メインループ
main_loop() {
    log_message "[Water Spider] 🕷️ 監視システム起動"
    report_to_conductor "[Water Spider] 🕷️ 監視システム起動 - 全Agentを監視中"

    local cycle=0

    while true; do
        cycle=$((cycle + 1))
        log_message "[Water Spider] 📊 監視サイクル #${cycle} 開始"

        # ダッシュボード生成
        generate_dashboard "$cycle"

        # 全Agentにping送信
        for pane_id in "${!AGENTS[@]}"; do
            agent_name="${AGENTS[$pane_id]}"

            # pane存在確認
            if ! tmux list-panes -F '#{pane_id}' | grep -q "^${pane_id}$"; then
                log_message "[Water Spider] ⚠️ ${agent_name}のpaneが存在しません"
                report_to_conductor "[Water Spider] ⚠️ ${agent_name}のpane消失 - 確認してください"
                continue
            fi

            # セッション生存確認
            if ! check_session_alive "$pane_id" "$agent_name"; then
                log_message "[Water Spider] ⚠️ ${agent_name}のセッション異常検出"
                auto_recovery "$pane_id" "$agent_name"
                continue
            fi

            # ping送信
            send_ping "$pane_id" "$agent_name"
            sleep 1
        done

        # 応答待機
        log_message "[Water Spider] ⏳ 応答待機中（${PING_TIMEOUT}秒）"
        sleep $PING_TIMEOUT

        # 応答確認
        for pane_id in "${!AGENTS[@]}"; do
            agent_name="${AGENTS[$pane_id]}"

            if ! check_response "$pane_id" "$agent_name"; then
                # 復旧試行
                auto_recovery "$pane_id" "$agent_name"
            fi
        done

        log_message "[Water Spider] 📊 監視サイクル #${cycle} 完了 - 次のサイクルまで${CHECK_INTERVAL}秒待機"
        sleep $CHECK_INTERVAL
    done
}

# 初期化
mkdir -p "$(dirname "$LOG_FILE")"

# シグナルハンドラ
trap 'log_message "[Water Spider] 🛑 監視システム停止"; report_to_conductor "[Water Spider] 🛑 監視システム停止"; exit 0' SIGINT SIGTERM

# スクリプト開始
main_loop
