#!/bin/bash
# Miyabi Orchestra - Water Spider Performance Management & Monitoring
# Version: 3.0.0 - Performance Management Edition
# Purpose: Monitor, manage performance, enforce SLA, and continuous improvement

WORKING_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
CONDUCTOR_PANE="%1"
LOG_FILE="$WORKING_DIR/.ai/logs/water-spider.log"
RELAY_LOG_FILE="$WORKING_DIR/.ai/logs/water-spider-relay.log"
TASK_QUEUE_FILE="$WORKING_DIR/.ai/queue/tasks.json"
TMUX_THEME_FILE="$HOME/.tmux.miyabi.conf"
TMUX_INACTIVE_BG="#1d1d1d"
TMUX_ACTIVE_BG="#242424"
TMUX_INACTIVE_FG="#d7d7d7"
TMUX_ACTIVE_FG="#ffffff"
TMUX_THEME_FILE="$HOME/.tmux.miyabi.conf"
TMUX_INACTIVE_BG="#1d1d1d"
TMUX_ACTIVE_BG="#242424"
TMUX_INACTIVE_FG="#d7d7d7"
TMUX_ACTIVE_FG="#ffffff"

# Performance Management
PERF_MANAGER="$WORKING_DIR/scripts/water-spider-performance-manager.sh"
METRICS_FILE="$WORKING_DIR/.ai/metrics/performance-metrics.json"
SLA_FILE="$WORKING_DIR/.ai/metrics/sla-violations.log"
KPI_REPORT="$WORKING_DIR/.ai/reports/kpi-dashboard.md"

# Performance thresholds
PERF_CHECK_INTERVAL=300         # パフォーマンスチェック間隔（5分）
KPI_UPDATE_INTERVAL=1800        # KPIダッシュボード更新間隔（30分）
SLA_MAX_TASK_DURATION=3600      # 最大タスク時間: 60分
SLA_MAX_IDLE_TIME=300           # 最大アイドル時間: 5分
AUTO_REBALANCE_THRESHOLD=0.3    # 自動リバランス閾値（30%エラー率）

PANE_IDS=()
AGENT_NAMES=()

normalize_agent_name() {
    local pane_title="$1"
    case "$pane_title" in
        *"カエデ"*) echo "カエデ" ;;
        *"サクラ"*) echo "サクラ" ;;
        *"ツバキ | pr-management"*) echo "ツバキ-PR" ;;
        *"ツバキ"*) echo "ツバキ" ;;
        *"ボタン"*) echo "ボタン" ;;
        *"スミレ"*) echo "スミレ" ;;
        *"カスミ"*) echo "カスミ" ;;
        *"モミジ"*) echo "モミジ" ;;
        *"アヤメ"*) echo "アヤメ" ;;
        *"キキョウ"*) echo "キキョウ" ;;
        *"Conductor"*) echo "しきるん" ;;
        *"みつけるん"*) echo "みつけるん" ;;
        *"水蜘蛛"*) echo "クモ" ;;
        *"Water Spider"*) echo "クモ" ;;
        *"Codex-1"*) echo "Codex-1" ;;
        *"Codex-2"*) echo "Codex-2" ;;
        *"Codex-3"*) echo "Codex-3" ;;
        *"Codex-4"*) echo "Codex-4" ;;
        "")
            echo ""
            ;;
        *)
            echo "$pane_title"
            ;;
    esac
}

refresh_agent_registry() {
    PANE_IDS=()
    AGENT_NAMES=()

    if ! command -v tmux >/dev/null 2>&1; then
        return
    fi

    local delimiter='__WS_DELIM__'
    local panes
    panes=$(tmux list-panes -a -F "#{pane_id}${delimiter}#{pane_title}" 2>/dev/null || true)

    while IFS= read -r pane_line; do
        [ -z "$pane_line" ] && continue

        if [[ "$pane_line" != *"$delimiter"* ]]; then
            continue
        fi

        local pane_id="${pane_line%%${delimiter}*}"
        local pane_title="${pane_line#*${delimiter}}"
        [ -z "$pane_id" ] && continue

        local agent_name
        agent_name=$(normalize_agent_name "$pane_title")
        if [ -z "$agent_name" ] || [ "$agent_name" = "$pane_title" ]; then
            agent_name="Pane-${pane_id}"
        fi

        PANE_IDS+=("$pane_id")
        AGENT_NAMES+=("$agent_name")
    done <<< "$panes"
}

resolve_agent_pane() {
    local agent_name="$1"
    local idx
    for idx in "${!AGENT_NAMES[@]}"; do
        if [ "${AGENT_NAMES[$idx]}" = "$agent_name" ]; then
            echo "${PANE_IDS[$idx]}"
            return 0
        fi
    done
    return 1
}

was_message_processed() {
    local hash="$1"
    local entry
    for entry in "${LAST_PROCESSED_MESSAGES[@]}"; do
        if [ "$entry" = "$hash" ]; then
            return 0
        fi
    done
    return 1
}

mark_message_processed() {
    local hash="$1"
    LAST_PROCESSED_MESSAGES+=("$hash")
}

# タスク連鎖ルール定義 - W1-W5完全自動化対応
TASK_CHAIN_RULES_LIST=(
    "みつけるん|トリアージ完了:しきるん|みつけるんがIssueトリアージを完了しました。タスク分解を開始してください。"
    "しきるん|計画完了:カエデ|しきるんがタスク分解を完了しました。実装を開始してください。"
    "しきるん|タスク分解完了:カエデ|しきるんがタスク分解を完了しました。実装を開始してください。"
    "カエデ|実装完了:サクラ|カエデが実装を完了しました。コードレビューを開始してください。"
    "カエデ|コード完了:サクラ|カエデがコードを完了しました。レビューを開始してください。"
    "サクラ|レビュー完了:ツバキ|サクラがレビューを完了しました。PR作成を開始してください。"
    "サクラ|承認:ツバキ|サクラが承認しました。PR作成を開始してください。"
    "ツバキ|PR作成完了:ボタン|ツバキがPRを作成しました。デプロイを開始してください。"
    "ツバキ|PR完了:ボタン|ツバキがPR完了しました。デプロイしてください。"
)

# 設定
PING_TIMEOUT=30
CHECK_INTERVAL=60
RECOVERY_ATTEMPTS=3
MESSAGE_RELAY_INTERVAL=5  # メッセージ中継チェック間隔（秒）

# 最後に処理したメッセージを記録（重複防止）
LAST_PROCESSED_MESSAGES=()

# ログ関数
log_message() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

# 中継ログ関数
log_relay() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$RELAY_LOG_FILE"
}

# tmuxテーマをダークグレースケールに統一
apply_tmux_dark_grayscale_theme() {
    if ! command -v tmux >/dev/null 2>&1; then
        return
    fi

    # tmuxサーバーが動作していない場合は何もしない
    if ! tmux list-sessions >/dev/null 2>&1; then
        return
    fi

    if [ -f "$TMUX_THEME_FILE" ]; then
        tmux source-file "$TMUX_THEME_FILE" >/dev/null 2>&1 && \
            log_message "[Water Spider] 🎨 tmuxテーマを ${TMUX_THEME_FILE} から再適用"
        return
    fi

    tmux set-option -g window-style "bg=${TMUX_INACTIVE_BG},fg=${TMUX_INACTIVE_FG}" >/dev/null 2>&1 || true
    tmux set-option -g window-active-style "bg=${TMUX_ACTIVE_BG},fg=${TMUX_ACTIVE_FG}" >/dev/null 2>&1 || true
    tmux set-option -g pane-border-style "fg=#555555,bg=${TMUX_INACTIVE_BG}" >/dev/null 2>&1 || true
    tmux set-option -g pane-active-border-style "fg=${TMUX_ACTIVE_FG},bold,bg=${TMUX_ACTIVE_BG}" >/dev/null 2>&1 || true
    log_message "[Water Spider] 🎨 tmuxテーマをダークグレースケールで適用（フォールバック）"
}

# ========================================
# タスクキュー管理機能
# ========================================

# Agent別のVOICEVOX Speaker ID取得
get_agent_speaker_id() {
    case "$1" in
        "カンナ") echo "3" ;;         # ずんだもん（ノーマル）
        "みつけるん") echo "46" ;;    # 小夜/SAYO（ノーマル）
        "しきるん") echo "47" ;;      # ナースロボ_タイプT（ノーマル）
        "カエデ") echo "3" ;;         # ずんだもん（ノーマル）
        "サクラ") echo "1" ;;         # 四国めたん（ノーマル）
        "ツバキ") echo "8" ;;         # 春日部つむぎ（ノーマル）
        "ボタン") echo "14" ;;        # 冥鳴ひまり（ノーマル）
        "クモ") echo "3" ;;           # ずんだもん（ノーマル）
        *) echo "3" ;;                # デフォルト: ずんだもん
    esac
}

# VOICEVOX音声通知
send_voicevox_notification() {
    local agent_name="$1"
    local message="$2"
    local speed="${3:-1.0}"

    local speaker_id=$(get_agent_speaker_id "$agent_name")

    if [ -x "$WORKING_DIR/tools/voicevox_enqueue.sh" ]; then
        "$WORKING_DIR/tools/voicevox_enqueue.sh" "$message" "$speaker_id" "$speed" 2>/dev/null || true
    fi
}

# タスクキューから次の最優先タスクを取得
get_next_task_from_queue() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo ""
        return
    fi

    # priority順（critical > high > medium > low）でpendingタスクを取得
    local next_task=$(jq -r '
        .tasks
        | map(select(.status == "pending"))
        | sort_by(
            if .priority == "critical" then 1
            elif .priority == "high" then 2
            elif .priority == "medium" then 3
            elif .priority == "low" then 4
            else 5 end
        )
        | .[0]
        | .issue_number // empty
    ' "$TASK_QUEUE_FILE" 2>/dev/null)

    echo "$next_task"
}

# タスクキューのステータス更新
update_task_queue_status() {
    local task_id="$1"
    local new_status="$2"
    local agent_name="${3:-null}"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        return
    fi

    # 一時ファイルに書き込み
    local tmp_file="${TASK_QUEUE_FILE}.tmp"

    if [ "$new_status" == "in_progress" ]; then
        jq --arg id "$task_id" --arg status "$new_status" --arg agent "$agent_name" \
            '(.tasks[] | select(.issue_number == $id) | .status) = $status |
             (.tasks[] | select(.issue_number == $id) | .assigned_agent) = $agent |
             (.tasks[] | select(.issue_number == $id) | .started_at) = now | todate' \
            "$TASK_QUEUE_FILE" > "$tmp_file"
    elif [ "$new_status" == "completed" ]; then
        jq --arg id "$task_id" --arg status "$new_status" \
            '(.tasks[] | select(.issue_number == $id) | .status) = $status |
             (.tasks[] | select(.issue_number == $id) | .completed_at) = now | todate' \
            "$TASK_QUEUE_FILE" > "$tmp_file"
    else
        jq --arg id "$task_id" --arg status "$new_status" \
            '(.tasks[] | select(.issue_number == $id) | .status) = $status' \
            "$TASK_QUEUE_FILE" > "$tmp_file"
    fi

    mv "$tmp_file" "$TASK_QUEUE_FILE"
    jq '.last_updated = now | todate' "$TASK_QUEUE_FILE" > "$tmp_file"
    mv "$tmp_file" "$TASK_QUEUE_FILE"
}

# Agentにタスクを割り当て
assign_task_to_agent() {
    local pane_id="$1"
    local agent_name="$2"
    local task_id="$3"

    # タスク詳細を取得
    local task_info=$(jq -r ".tasks[] | select(.issue_number == \"$task_id\")" "$TASK_QUEUE_FILE" 2>/dev/null)
    local task_title=$(echo "$task_info" | jq -r '.title // "Unknown"')
    local task_priority=$(echo "$task_info" | jq -r '.priority // "medium"')

    log_message "[Auto-Assign] 📋 Issue #${task_id} (${task_priority}) を ${agent_name} に割り当て"

    # Agent種別に応じた指示 - W1-W5対応 + Rust Commands最適化
    local instruction=""
    case "$agent_name" in
        "みつけるん")
            instruction="Issue #${task_id}「${task_title}」のトリアージを行ってください。issue-analysisスキルを使用して、適切なLabel (57-label system) を推定し、優先度を設定し、state:pendingを付与してください。完了したら [みつけるん] トリアージ完了 と発言してください。"
            ;;
        "しきるん")
            instruction="Issue #${task_id}「${task_title}」をTask配列に分解し、DAGを構築し、Agent割り当てを行ってください。agent-executionスキルを使用してください。完了したら [しきるん] タスク分解完了 と発言してください。"
            ;;
        "カエデ")
            instruction="Issue #${task_id}「${task_title}」を実装してください。

【実装フェーズ】
1. agent-executionスキルとrust-developmentスキルを使用
2. コード実装・テスト作成

【検証フェーズ - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください。1つでも失敗したら即座に停止して報告してください:
- cargo build --release
- cargo test --all
- cargo clippy -- -D warnings

【完了報告】
全て成功したら [カエデ] 実装完了 と発言してください。失敗した場合は [カエデ] エラー: {詳細} と報告してください。"
            ;;
        "サクラ")
            instruction="Issue #${task_id}「${task_title}」のコードレビューを実行してください。

【レビューフェーズ - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo audit（セキュリティ脆弱性チェック）
- cargo clippy -- -D warnings -W clippy::all（コード品質）
- cargo test --all（テスト実行）

【品質評価】
1. 品質スコア算出（0-100点）
2. セキュリティissue列挙
3. 改善推奨事項まとめ

【完了報告】
GitHub commentに投稿して [サクラ] レビュー完了 と発言してください。エラー時は [サクラ] エラー: {詳細} と報告してください。"
            ;;
        "ツバキ")
            instruction="Issue #${task_id}「${task_title}」のPRを作成してください。

【PR作成前チェック - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo fmt -- --check（フォーマットチェック）
- cargo clippy -- -D warnings（Lintチェック）
- cargo test --all（テスト実行）

【PR作成】
1. 全チェック成功後、git-workflowスキルでPR作成
2. Conventional Commits形式でコミットメッセージ作成

【完了報告】
[ツバキ] PR作成完了 と発言してください。エラー時は [ツバキ] エラー: {詳細} と報告してください。"
            ;;
        "ボタン")
            instruction="Issue #${task_id}「${task_title}」をデプロイしてください。

【デプロイ前検証 - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo build --release --all（リリースビルド）
- cargo test --release --all（リリーステスト）

【デプロイ実行】
1. 全検証成功後、デプロイ実行
2. ヘルスチェック確認
3. Issueクローズ

【完了報告】
[ボタン] デプロイ完了 と発言してください。エラー時は [ボタン] エラー: {詳細} と報告してください。"
            ;;
        *)
            instruction="Issue #${task_id}「${task_title}」を処理してください。"
            ;;
    esac

    # Agentに送信
    send_to_agent "$pane_id" "$agent_name" "$instruction"

    # タスクキューのステータス更新
    update_task_queue_status "$task_id" "in_progress" "$agent_name"

    # 📊 Performance: タスク開始メトリクス記録
    if [ -x "$PERF_MANAGER" ]; then
        "$PERF_MANAGER" record "$agent_name" "task_started" "$task_id" 2>/dev/null || true
    fi

    # ペインUIを更新（実行中ステータス）
    if command -v "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" &>/dev/null; then
        "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" update "$agent_name" "Issue #${task_id} (${task_priority}) 実行中" "in_progress" 2>/dev/null || true
    fi

    # 🔊 VOICEVOX: タスク割り当て通知（Conductorの声で）
    local assignment_message="${agent_name}、Issue ${task_id}、開始。"
    send_voicevox_notification "カンナ" "$assignment_message" 1.1
    log_relay "[VOICEVOX] 🔊 カンナ: ${assignment_message}"

    # Conductorに報告
    report_to_conductor "[Water Spider] 🎯 ${agent_name}に Issue #${task_id} (${task_priority}) を割り当てました"
}

# タスク完了時に次のタスクを自動割り当て
on_task_complete_assign_next() {
    local completed_agent="$1"
    local trigger_keyword="$2"

    log_message "[Auto-Assign] ✅ ${completed_agent}がタスク完了: ${trigger_keyword}"
    report_to_conductor "[Water Spider] ✅ ${completed_agent}タスク完了"

    # 完了したタスク情報を取得
    local completed_task_info=$(jq -r ".tasks[] | select(.assigned_agent == \"$completed_agent\" and .status == \"in_progress\")" "$TASK_QUEUE_FILE" 2>/dev/null | head -1)
    local completed_task_id=$(echo "$completed_task_info" | jq -r '.issue_number // "不明"')
    local completed_task_title=$(echo "$completed_task_info" | jq -r '.title // "不明"')

    # 🔊 VOICEVOX: タスク完了報告（完了したAgentの声で）
    if [ "$completed_task_id" != "不明" ]; then
        local completion_message="Issue ${completed_task_id}、完了。"
        send_voicevox_notification "$completed_agent" "$completion_message" 1.1
        log_relay "[VOICEVOX] 🔊 ${completed_agent}: ${completion_message}"
    fi

    # タスクステータスを完了に更新
    if [ "$completed_task_id" != "不明" ]; then
        update_task_queue_status "$completed_task_id" "completed"

        # 📊 Performance: タスク完了メトリクス記録
        if [ -x "$PERF_MANAGER" ]; then
            "$PERF_MANAGER" record "$completed_agent" "task_completed" "$completed_task_id" 2>/dev/null || true
        fi
    fi

    # 次のタスクを取得
    local next_task=$(get_next_task_from_queue)

    if [ ! -z "$next_task" ]; then
        local pane_id
        pane_id=$(resolve_agent_pane "$completed_agent") || pane_id=""
        if [ -z "$pane_id" ]; then
            log_message "[Auto-Assign] ⚠️ ${completed_agent}のpaneが見つからずタスク割り当てをスキップ"
            return
        fi
        local next_task_info=$(jq -r ".tasks[] | select(.issue_number == \"$next_task\")" "$TASK_QUEUE_FILE" 2>/dev/null)
        local next_task_title=$(echo "$next_task_info" | jq -r '.title // "不明"')

        log_message "[Auto-Assign] 🔄 次のタスク Issue #${next_task} を ${completed_agent} に割り当て"

        # 🔊 VOICEVOX: 次タスク割り当て通知（Conductorの声で）
        local next_assignment_message="次、Issue ${next_task}。"
        send_voicevox_notification "カンナ" "$next_assignment_message" 1.2
        log_relay "[VOICEVOX] 🔊 カンナ: ${next_assignment_message}"

        # 即座に次のタスクを割り当て
        assign_task_to_agent "$pane_id" "$completed_agent" "$next_task"
    else
        log_message "[Auto-Assign] ⚠️ タスクキューが空 - ${completed_agent}は待機状態"
        report_to_conductor "[Water Spider] ⏸️ タスクキューが空 - ${completed_agent}待機中"

        # 🔊 VOICEVOX: キュー空通知（Conductorの声で）
        local empty_queue_message="タスクなし。待機。"
        send_voicevox_notification "カンナ" "$empty_queue_message" 1.0
        log_relay "[VOICEVOX] 🔊 カンナ: ${empty_queue_message}"

        # ペインUIを更新（待機状態）
        if command -v "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" &>/dev/null; then
            "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" update "$completed_agent" "タスク待機中（キュー空）" 2>/dev/null || true
        fi
    fi
}

# Conductorに報告
report_to_conductor() {
    local message="$1"
    if tmux list-panes -a -F '#{pane_id}' | grep -q "^${CONDUCTOR_PANE}$"; then
        tmux send-keys -t "$CONDUCTOR_PANE" "$message" && sleep 0.5 && tmux send-keys -t "$CONDUCTOR_PANE" Enter
    fi
}

# Agentにメッセージ送信
send_to_agent() {
    local pane_id="$1"
    local agent_name="$2"
    local message="$3"
    local max_retries=3

    local full_message="cd '$WORKING_DIR' && あなたは「${agent_name}」です。${message}"

    # 複数回リトライで確実に送信
    for attempt in $(seq 1 $max_retries); do
        # まず既存の入力をクリア
        tmux send-keys -t "$pane_id" C-c 2>/dev/null || true
        sleep 0.5

        # メッセージ送信
        tmux send-keys -t "$pane_id" "$full_message" 2>/dev/null || true
        sleep 0.8

        # Enterキー送信（複数回で確実に）
        tmux send-keys -t "$pane_id" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$pane_id" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$pane_id" Enter 2>/dev/null || true
        sleep 0.3

        # 送信確認（プロンプトまたは実行中の表示を探す）
        local output=$(tmux capture-pane -t "$pane_id" -p | tail -10)

        # 実行開始の兆候をチェック
        if echo "$output" | grep -q -E "⏺|Thought|Read|Edit|Bash|Skill|あなたは「${agent_name}」"; then
            log_relay "[Relay] ✅ ${agent_name}へ送信成功 (試行 $attempt/$max_retries): ${message}"
            return 0
        fi

        log_relay "[Relay] ⚠️ ${agent_name}への送信リトライ中... ($attempt/$max_retries)"
        sleep 1
    done

    log_relay "[Relay] ❌ ${agent_name}への送信失敗（$max_retries回試行）: ${message}"
    return 1
}

# メッセージ検出と中継
detect_and_relay_messages() {
    local source_pane="$1"
    local source_agent="$2"

    # 最新の出力を取得
    local recent_output=$(tmux capture-pane -t "$source_pane" -p | tail -20)

    # 各ルールをチェック
    for rule in "${TASK_CHAIN_RULES_LIST[@]}"; do
        IFS=':' read -r trigger_part target_part <<< "$rule"
        IFS='|' read -r trigger_agent trigger_keyword <<< "$trigger_part"

        # 現在のAgentがトリガーAgentと一致するか確認
        if [ "$source_agent" != "$trigger_agent" ]; then
            continue
        fi

        # キーワードを検出
        if echo "$recent_output" | grep -q "$trigger_keyword"; then
            # 重複チェック
            local message_hash=$(echo "${source_agent}:${trigger_keyword}" | md5)

            if was_message_processed "$message_hash"; then
                # 既に処理済み
                continue
            fi

            # 処理済みとしてマーク
            mark_message_processed "$message_hash"

            # ルール値を解析
            IFS='|' read -r target_agent relay_message <<< "$target_part"

            local target_pane
            target_pane=$(resolve_agent_pane "$target_agent") || target_pane=""

            if [ -z "$target_pane" ]; then
                log_relay "[Relay] ⚠️ ${target_agent}のpane IDが見つかりません"
                continue
            fi

            # メッセージ中継
            log_relay "[Relay] 🔗 ${source_agent}から${target_agent}へ: ${trigger_keyword} 検出"
            report_to_conductor "[Water Spider] 🔗 ${source_agent} → ${target_agent}: ${trigger_keyword}"

            send_to_agent "$target_pane" "$target_agent" "$relay_message"

            # ログに記録
            log_relay "[Relay] ✅ 中継完了: ${source_agent} → ${target_agent}"
        fi
    done

    # タスク完了検出 - 自動タスク割り当て
    if echo "$recent_output" | grep -qE "(実装完了|レビュー完了|PR作成完了|PR完了|デプロイ完了)"; then
        local completion_keyword=$(echo "$recent_output" | grep -oE "(実装完了|レビュー完了|PR作成完了|PR完了|デプロイ完了)" | head -1)

        # 重複チェック（タスク完了の場合も）
        local completion_hash=$(echo "${source_agent}:completion:${completion_keyword}" | md5)

        if ! was_message_processed "$completion_hash"; then
            mark_message_processed "$completion_hash"

            # 次のタスクを自動割り当て
            on_task_complete_assign_next "$source_agent" "$completion_keyword"
        fi
    fi
}

# メッセージ中継ループ（バックグラウンド）
message_relay_loop() {
    log_message "[Water Spider] 🔄 メッセージ中継システム起動"
    report_to_conductor "[Water Spider] 🔄 メッセージ中継システム起動"

    while true; do
        # 全Agentの出力を監視
        for idx in "${!PANE_IDS[@]}"; do
            local pane_id="${PANE_IDS[$idx]}"
            local agent_name="${AGENT_NAMES[$idx]}"

            # pane存在確認
            if ! tmux list-panes -a -F '#{pane_id}' | grep -q "^${pane_id}$"; then
                continue
            fi

            # メッセージ検出と中継
            detect_and_relay_messages "$pane_id" "$agent_name"
        done

        sleep $MESSAGE_RELAY_INTERVAL
    done
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
    if ! tmux list-panes -a -F '#{pane_id}' | grep -q "^${pane_id}$"; then
        log_message "[Water Spider] ❌ ${agent_name}のpaneが存在しません"
        return 1
    fi

    if [[ "$agent_name" == Pane-* ]]; then
        return 0
    fi

    # Claude Code起動確認
    local output=$(tmux capture-pane -t "$pane_id" -p | tail -5)
    if echo "$output" | grep -q "bypass permissions"; then
        return 0
    fi

    if echo "$output" | grep -Eq "❯|[$#] $|% $|▶"; then
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
    echo "🕷️  Miyabi Orchestra - Water Spider v2.0 (Message Relay)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Monitoring Cycle: #${cycle}"
    echo "⏰ Last Update: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "┌──────────────────────────────────────────────────┐"
    echo "│ Agent Status                                      │"
    echo "├──────────────────────────────────────────────────┤"

    for idx in "${!PANE_IDS[@]}"; do
        local pane_id="${PANE_IDS[$idx]}"
        local agent_name="${AGENT_NAMES[$idx]}"

        # pane存在確認
        if ! tmux list-panes -a -F '#{pane_id}' | grep -q "^${pane_id}$"; then
            printf "│ %-20s [❌ OFFLINE]                   │\n" "$agent_name ($pane_id)"
            continue
        fi

        # セッション確認
        if check_session_alive "$pane_id" "$agent_name" 2>/dev/null; then
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
    echo "  - Message Relay: Every ${MESSAGE_RELAY_INTERVAL}s"
    echo ""
    echo "🔔 Recent Events (from log):"
    tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "🔗 Recent Relay Events:"
    tail -3 "$RELAY_LOG_FILE" 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# メインループ
main_loop() {
    log_message "[Water Spider] 🕷️ 自律型パフォーマンス管理システム起動 (v3.0 - Autonomous Performance Management)"
    report_to_conductor "[Water Spider] 🕷️ v3.0起動 - 完全自律運用開始（パフォーマンス管理・SLA監視・自動タスク割り当て）"

    # VOICEVOXで起動通知
    send_voicevox_notification "クモ" "Water Spider、v3.0、起動。完全自律運用、開始。" 1.0 2>/dev/null || true

    # メッセージ中継ループをバックグラウンドで起動
    message_relay_loop &
    RELAY_LOOP_PID=$!
    log_message "[Water Spider] 🔄 メッセージ中継ループ起動（PID: $RELAY_LOOP_PID）"

    # 初回KPIダッシュボード生成
    log_message "[Performance] 📊 初回KPIダッシュボード生成中..."
    if [ -x "$PERF_MANAGER" ]; then
        "$PERF_MANAGER" dashboard 2>/dev/null || true
    fi

    refresh_agent_registry

    local cycle=0

    while true; do
        cycle=$((cycle + 1))
        log_message "[Water Spider] 📊 監視サイクル #${cycle} 開始"

        refresh_agent_registry

        # ダッシュボード生成
        generate_dashboard "$cycle"

        # 全Agentにping送信
        for idx in "${!PANE_IDS[@]}"; do
            local pane_id="${PANE_IDS[$idx]}"
            local agent_name="${AGENT_NAMES[$idx]}"

            if [[ "$agent_name" == Pane-* ]]; then
                # Passive monitoring: pane存在のみ確認
                if ! tmux list-panes -a -F '#{pane_id}' | grep -q "^${pane_id}$"; then
                    log_message "[Water Spider] ⚠️ ${agent_name}のpaneが存在しません"
                fi
                continue
            fi

            # pane存在確認
            if ! tmux list-panes -a -F '#{pane_id}' | grep -q "^${pane_id}$"; then
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
        for idx in "${!PANE_IDS[@]}"; do
            local pane_id="${PANE_IDS[$idx]}"
            local agent_name="${AGENT_NAMES[$idx]}"

            if [[ "$agent_name" == Pane-* ]]; then
                continue
            fi

            if ! check_response "$pane_id" "$agent_name"; then
                # 復旧試行
                auto_recovery "$pane_id" "$agent_name"
            fi
        done

        # 🤖 自律管理: アイドルエージェント検出と自動タスク割り当て
        for idx in "${!PANE_IDS[@]}"; do
            local pane_id="${PANE_IDS[$idx]}"
            local agent_name="${AGENT_NAMES[$idx]}"

            if [[ "$agent_name" == Pane-* ]]; then
                continue
            fi

            # 現在のタスクステータス確認
            local agent_task=$(jq -r ".tasks[] | select(.assigned_agent == \"$agent_name\" and .status == \"in_progress\") | .issue_number" "$TASK_QUEUE_FILE" 2>/dev/null)

            # タスクが割り当てられていない場合
            if [ -z "$agent_task" ]; then
                log_message "[Auto-Manage] 💤 ${agent_name}がアイドル状態 - 自動タスク割り当てを試行"

                # アイドル開始記録
                if [ -x "$PERF_MANAGER" ]; then
                    "$PERF_MANAGER" record "$agent_name" "idle_start" "N/A" 2>/dev/null || true
                fi

                # 次のタスクを取得
                local next_task=$(get_next_task_from_queue)

                if [ ! -z "$next_task" ]; then
                    log_message "[Auto-Manage] 🎯 ${agent_name}にタスクを自動割り当て: Issue #${next_task}"

                    # アイドル終了記録
                    if [ -x "$PERF_MANAGER" ]; then
                        "$PERF_MANAGER" record "$agent_name" "idle_end" "N/A" 2>/dev/null || true
                    fi

                    # タスク割り当て
                    assign_task_to_agent "$pane_id" "$agent_name" "$next_task"
                else
                    log_message "[Auto-Manage] ⏸️ ${agent_name}: タスクキューが空 - 待機継続"

                    # ペインUI更新（待機状態）
                    if command -v "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" &>/dev/null; then
                        "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" update "$agent_name" "タスク待機中（キュー空）" "stopped" 2>/dev/null || true
                    fi
                fi
            fi
        done

        # 📊 Performance: 定期的なKPI更新（30分ごと）
        local elapsed_time=$((cycle * CHECK_INTERVAL))
        if [ $((elapsed_time % KPI_UPDATE_INTERVAL)) -eq 0 ] && [ "$cycle" -gt 0 ]; then
            log_message "[Performance] 📈 KPIダッシュボード更新中..."
            if [ -x "$PERF_MANAGER" ]; then
                "$PERF_MANAGER" dashboard 2>/dev/null || true
                log_message "[Performance] ✅ KPIダッシュボード更新完了"

                # VOICEVOXで報告
                send_voicevox_notification "カンナ" "KPI更新、完了。" 1.0 2>/dev/null || true
            fi
        fi

        # 📊 Performance: SLA違反チェック（5分ごと）
        if [ $((elapsed_time % PERF_CHECK_INTERVAL)) -eq 0 ] && [ "$cycle" -gt 0 ]; then
            log_message "[Performance] ⚖️ SLA違反チェック中..."

            local violations_detected=0
            for agent in "${AGENT_NAMES[@]}"; do
                if [[ "$agent" == Pane-* ]]; then
                    continue
                fi
                if [ -x "$PERF_MANAGER" ]; then
                    if ! "$PERF_MANAGER" sla "$agent" 2>/dev/null; then
                        violations_detected=$((violations_detected + 1))
                        log_message "[Performance] ⚠️ SLA違反検出: $agent"

                        # SLA違反時の自動アクション: タスク再割り当て検討
                        # （エラー率が高い場合など）
                    fi
                fi
            done

            if [ "$violations_detected" -gt 0 ]; then
                log_message "[Performance] 🚨 SLA違反: ${violations_detected}件"
                send_voicevox_notification "カンナ" "SLA違反、${violations_detected}件。" 1.0 2>/dev/null || true
            else
                log_message "[Performance] ✅ SLA遵守: 全エージェント正常"
            fi
        fi

        # 🎼 Conductor: 自律判断・最適化（10分ごと）
        if [ $((elapsed_time % 600)) -eq 0 ] && [ "$cycle" -gt 0 ]; then
            log_message "[Conductor] 🎼 自律判断開始..."
            send_voicevox_notification "カンナ" "自律最適化、開始。" 1.0 2>/dev/null || true

            # Conductor自律制御スクリプト
            local conductor_script="$WORKING_DIR/scripts/conductor-autonomous-control.sh"

            if [ -x "$conductor_script" ]; then
                # 1. ワークロード分析とスケーリング判断
                log_message "[Conductor] 📊 ワークロード分析中..."
                "$conductor_script" scale 2>/dev/null || true

                # 2. レイアウト最適化
                log_message "[Conductor] 🎨 レイアウト最適化中..."
                "$conductor_script" optimize auto 2>/dev/null || true

                log_message "[Conductor] ✅ 自律最適化完了"
                send_voicevox_notification "カンナ" "最適化、完了。" 1.0 2>/dev/null || true
            else
                log_message "[Conductor] ⚠️ 自律制御スクリプトが見つかりません"
            fi
        fi

        log_message "[Water Spider] 📊 監視サイクル #${cycle} 完了 - 次のサイクルまで${CHECK_INTERVAL}秒待機"
        sleep $CHECK_INTERVAL
    done
}

# クリーンアップ
cleanup() {
    log_message "[Water Spider] 🛑 監視システム停止"
    report_to_conductor "[Water Spider] 🛑 監視システム停止"

    # メッセージ中継ループを停止
    if [ ! -z "$RELAY_LOOP_PID" ]; then
        kill $RELAY_LOOP_PID 2>/dev/null
        log_message "[Water Spider] 🔄 メッセージ中継ループ停止（PID: $RELAY_LOOP_PID）"
    fi

    exit 0
}

# 初期化
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$RELAY_LOG_FILE")"

# tmuxテーマ適用
apply_tmux_dark_grayscale_theme

# シグナルハンドラ
trap cleanup SIGINT SIGTERM

# スクリプト開始
main_loop
