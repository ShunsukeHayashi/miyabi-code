#!/bin/bash
# Codex Force Feed - Ensure Codex agents always have tasks
# Purpose: Aggressive task assignment to prevent Codex from idling

set -eo pipefail

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
TASK_QUEUE_FILE="$WORKING_DIR/.ai/queue/tasks.json"
LOG_FILE="$WORKING_DIR/.ai/logs/codex-force-feed.log"

# ログディレクトリ作成
mkdir -p "$(dirname "$LOG_FILE")"

# ログ
log_feed() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Codexペイン定義（エージェント名|ペインID形式）
CODEX_AGENTS=(
    "Codex-1|%7"
    "Codex-2|%8"
    "Codex-3|%11"
    "Codex-4|%10"
)

# 次のタスクを取得
get_next_task() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo ""
        return
    fi

    local next_task=$(jq -r '.tasks[] | select(.status == "pending") | .issue_number' "$TASK_QUEUE_FILE" 2>/dev/null | head -1)
    echo "$next_task"
}

# タスクステータス更新
update_task_status() {
    local task_id="$1"
    local status="$2"
    local agent="${3:-}"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        return
    fi

    local temp_file=$(mktemp)
    if [ -z "$agent" ]; then
        jq --arg task "$task_id" --arg status "$status" \
            '(.tasks[] | select(.issue_number == $task) | .status) = $status' \
            "$TASK_QUEUE_FILE" > "$temp_file"
    else
        jq --arg task "$task_id" --arg status "$status" --arg agent "$agent" \
            '(.tasks[] | select(.issue_number == $task) | .status) = $status |
             (.tasks[] | select(.issue_number == $task) | .assigned_agent) = $agent' \
            "$TASK_QUEUE_FILE" > "$temp_file"
    fi
    mv "$temp_file" "$TASK_QUEUE_FILE"
}

# Codexエージェントにタスクを強制送信
force_feed_codex() {
    local agent_name="$1"
    local pane_id="$2"

    # 現在のタスク確認
    local current_task=$(jq -r ".tasks[] | select(.assigned_agent == \"$agent_name\" and .status == \"in_progress\") | .issue_number" "$TASK_QUEUE_FILE" 2>/dev/null)

    # 既にタスクがある場合はスキップ
    if [ ! -z "$current_task" ]; then
        log_feed "✓ ${agent_name}: 既にタスク実行中 (Issue #${current_task})"
        return
    fi

    # アイドル検出
    log_feed "🎯 ${agent_name}: アイドル検出 - タスク強制供給開始"

    # 次のタスク取得
    local next_task=$(get_next_task)

    if [ -z "$next_task" ]; then
        log_feed "⏸️ ${agent_name}: タスクキューが空 - 待機"
        return
    fi

    # タスク情報取得
    local task_info=$(jq -r ".tasks[] | select(.issue_number == \"$next_task\")" "$TASK_QUEUE_FILE" 2>/dev/null)
    local task_title=$(echo "$task_info" | jq -r '.title // "Unknown"')

    log_feed "📨 ${agent_name}: Issue #${next_task} を強制送信中..."

    # タスクステータス更新
    update_task_status "$next_task" "in_progress" "$agent_name"

    # 強制的に送信（複数回リトライ）
    for attempt in {1..5}; do
        # 既存の入力をクリア
        tmux send-keys -t "$pane_id" C-c 2>/dev/null || true
        sleep 0.5

        # タスク送信
        local message="cd '$WORKING_DIR' && あなたは「${agent_name}」です。Issue #${next_task}「${task_title}」をcodexスキルで実装してください。完了したら [${agent_name}] 実装完了 と発言してください。"

        tmux send-keys -t "$pane_id" "$message" 2>/dev/null || true
        sleep 0.8

        # Enterキー連打
        for i in {1..4}; do
            tmux send-keys -t "$pane_id" Enter 2>/dev/null || true
            sleep 0.3
        done

        # 送信確認
        sleep 1
        local output=$(tmux capture-pane -t "$pane_id" -p | tail -15)

        if echo "$output" | grep -q -E "⏺|Thought|Read|Edit|Bash|Skill|codex|Issue #${next_task}"; then
            log_feed "✅ ${agent_name}: Issue #${next_task} 送信成功 (試行 $attempt/5)"

            # ペインUI更新
            if command -v "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" &>/dev/null; then
                "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" update "$agent_name" "Issue #${next_task} 実行中" "in_progress" 2>/dev/null || true
            fi

            # VOICEVOX通知
            if [ -x "$WORKING_DIR/tools/voicevox_enqueue.sh" ]; then
                "$WORKING_DIR/tools/voicevox_enqueue.sh" "${agent_name}、Issue ${next_task}、開始。" "11" "1.1" 2>/dev/null || true
            fi

            return 0
        fi

        log_feed "⚠️ ${agent_name}: リトライ中... ($attempt/5)"
        sleep 1
    done

    log_feed "❌ ${agent_name}: タスク送信失敗 (Issue #${next_task})"
    update_task_status "$next_task" "pending" ""
    return 1
}

# 全Codexエージェントをチェック
check_all_codex() {
    log_feed "🔍 全Codexエージェントチェック開始"

    for agent_def in "${CODEX_AGENTS[@]}"; do
        IFS='|' read -r agent_name pane_id <<< "$agent_def"

        # ペイン存在確認
        if ! tmux list-panes -F '#{pane_id}' 2>/dev/null | grep -q "^${pane_id}$"; then
            log_feed "⚠️ ${agent_name}: ペインが存在しません"
            continue
        fi

        force_feed_codex "$agent_name" "$pane_id"
    done

    log_feed "✅ Codexチェック完了"
}

# 継続監視モード
watch_mode() {
    log_feed "👁️ Codex継続監視モード起動（30秒ごと）"

    while true; do
        check_all_codex
        sleep 30
    done
}

# メイン実行
case "${1:-check}" in
    check)
        check_all_codex
        ;;
    watch)
        watch_mode
        ;;
    force)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 force <codex_name>"
            exit 1
        fi
        # エージェント名から対応するペインIDを検索
        local target_agent="$2"
        local found=false
        for agent_def in "${CODEX_AGENTS[@]}"; do
            IFS='|' read -r agent_name pane_id <<< "$agent_def"
            if [ "$agent_name" = "$target_agent" ]; then
                force_feed_codex "$agent_name" "$pane_id"
                found=true
                break
            fi
        done
        if [ "$found" = false ]; then
            echo "❌ エージェント '$target_agent' が見つかりません"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [check|watch|force <codex_name>]"
        echo ""
        echo "  check - 単発チェック・タスク供給"
        echo "  watch - 継続監視モード（30秒ごと）"
        echo "  force - 特定Codexに強制供給"
        exit 1
        ;;
esac
