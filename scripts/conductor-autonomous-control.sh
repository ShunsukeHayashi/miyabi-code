#!/bin/bash
# Conductor Autonomous Control - Orchestrator Self-Management
# Purpose: Allow Conductor to autonomously add agents, panels, and optimize layout

set -eo pipefail

WORKING_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
LOG_FILE="$WORKING_DIR/.ai/logs/conductor-control.log"
AGENT_REGISTRY="$WORKING_DIR/.ai/registry/agent-registry.json"
TASK_QUEUE_FILE="$WORKING_DIR/.ai/queue/tasks.json"

# ログディレクトリ作成
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$AGENT_REGISTRY")"

# ログ
log_conductor() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# VOICEVOX通知
notify_voice() {
    local message="$1"
    local speed="${2:-1.0}"

    if [ -x "$WORKING_DIR/tools/voicevox_enqueue.sh" ]; then
        "$WORKING_DIR/tools/voicevox_enqueue.sh" "$message" "3" "$speed" 2>/dev/null || true
    fi
}

# Agent Registry初期化
init_registry() {
    if [ ! -f "$AGENT_REGISTRY" ]; then
        cat > "$AGENT_REGISTRY" <<EOF
{
  "version": "1.0.0",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agents": {
    "カンナ": {"pane_id": "%1", "type": "conductor", "status": "active", "role": "orchestrator"},
    "クモ": {"pane_id": "%6", "type": "monitor", "status": "active", "role": "water-spider"},
    "カエデ": {"pane_id": "%2", "type": "codegen", "status": "active", "role": "implementation"},
    "サクラ": {"pane_id": "%5", "type": "review", "status": "active", "role": "code-review"},
    "ツバキ": {"pane_id": "%3", "type": "pr", "status": "active", "role": "pull-request"},
    "ボタン": {"pane_id": "%4", "type": "deploy", "status": "active", "role": "deployment"},
    "Codex-1": {"pane_id": "%7", "type": "codex", "status": "active", "role": "ai-coding"},
    "Codex-2": {"pane_id": "%8", "type": "codex", "status": "active", "role": "ai-coding"},
    "Codex-3": {"pane_id": "%9", "type": "codex", "status": "active", "role": "ai-coding"},
    "Codex-4": {"pane_id": "%10", "type": "codex", "status": "active", "role": "ai-coding"}
  },
  "next_pane_id": 11
}
EOF
    fi
}

# 次の利用可能なペインID取得
get_next_pane_id() {
    init_registry
    local next_id=$(jq -r '.next_pane_id' "$AGENT_REGISTRY")
    echo "%${next_id}"
}

# ペインID番号をインクリメント
increment_pane_id() {
    init_registry
    local temp_file=$(mktemp)
    jq '.next_pane_id += 1' "$AGENT_REGISTRY" > "$temp_file"
    mv "$temp_file" "$AGENT_REGISTRY"
}

# 新しいエージェントを追加
add_agent() {
    local agent_name="$1"
    local agent_type="$2"
    local agent_role="${3:-general}"

    log_conductor "🎯 新しいエージェント追加開始: $agent_name (Type: $agent_type)"
    notify_voice "新エージェント、${agent_name}、追加開始。" 1.1

    # 新しいペインを作成
    local new_pane_id=$(get_next_pane_id)

    log_conductor "📦 ペイン作成中: $new_pane_id"

    # tmuxでペイン分割
    tmux split-window -t Miyabi:1 -h -p 30
    local created_pane=$(tmux list-panes -t Miyabi:1 -F "#{pane_id}" | tail -1)

    log_conductor "✅ ペイン作成完了: $created_pane"

    # Registryに登録
    local temp_file=$(mktemp)
    jq --arg name "$agent_name" \
       --arg pane "$created_pane" \
       --arg type "$agent_type" \
       --arg role "$agent_role" \
       '.agents[$name] = {
           pane_id: $pane,
           type: $type,
           status: "active",
           role: $role,
           created_at: (now | todate)
       }' "$AGENT_REGISTRY" > "$temp_file"
    mv "$temp_file" "$AGENT_REGISTRY"

    increment_pane_id

    # エージェントを起動
    case "$agent_type" in
        "codex")
            tmux send-keys -t "$created_pane" "cd '$WORKING_DIR' && codex" Enter
            ;;
        "claude")
            tmux send-keys -t "$created_pane" "cd '$WORKING_DIR' && cc" Enter
            ;;
        "codegen")
            tmux send-keys -t "$created_pane" "cd '$WORKING_DIR' && cc" Enter
            ;;
        *)
            tmux send-keys -t "$created_pane" "cd '$WORKING_DIR' && bash" Enter
            ;;
    esac

    sleep 1

    # ペインUIを設定
    if command -v "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" &>/dev/null; then
        # 動的にペイン設定を追加（一時的な実装）
        tmux select-pane -t "$created_pane" -T "🆕 $agent_name | $agent_role"

        # ボーダー色設定
        local color="colour67"
        tmux set-option -p -t "$created_pane" pane-border-style "fg=$color" 2>/dev/null || true
        tmux set-option -p -t "$created_pane" pane-active-border-style "fg=$color,bold" 2>/dev/null || true
    fi

    log_conductor "✅ エージェント追加完了: $agent_name ($created_pane)"
    notify_voice "${agent_name}、追加完了。稼働開始。" 1.1

    echo "$created_pane"
}

# エージェントを削除
remove_agent() {
    local agent_name="$1"

    log_conductor "🗑️ エージェント削除開始: $agent_name"
    notify_voice "エージェント、${agent_name}、削除。" 1.0

    # Registryから取得
    local pane_id=$(jq -r --arg name "$agent_name" '.agents[$name].pane_id // empty' "$AGENT_REGISTRY")

    if [ -z "$pane_id" ]; then
        log_conductor "❌ エージェント '$agent_name' が見つかりません"
        return 1
    fi

    # ペインを削除
    tmux kill-pane -t "$pane_id" 2>/dev/null || true

    # Registryから削除
    local temp_file=$(mktemp)
    jq --arg name "$agent_name" 'del(.agents[$name])' "$AGENT_REGISTRY" > "$temp_file"
    mv "$temp_file" "$AGENT_REGISTRY"

    log_conductor "✅ エージェント削除完了: $agent_name"
}

# レイアウト最適化
optimize_layout() {
    local layout_type="${1:-auto}"

    log_conductor "🎨 レイアウト最適化開始: $layout_type"
    notify_voice "レイアウト、最適化開始。" 1.0

    # 現在のペイン数を取得
    local pane_count=$(tmux list-panes -t Miyabi:1 | wc -l | tr -d ' ')

    log_conductor "📊 現在のペイン数: $pane_count"

    case "$layout_type" in
        "auto")
            # ペイン数に応じて自動選択
            if [ "$pane_count" -le 4 ]; then
                tmux select-layout -t Miyabi:1 tiled
                log_conductor "✅ Layout: tiled (≤4 panes)"
            elif [ "$pane_count" -le 9 ]; then
                tmux select-layout -t Miyabi:1 tiled
                log_conductor "✅ Layout: tiled (5-9 panes)"
            else
                # 10以上はカスタムレイアウト
                # カンナを大きく、他を均等に
                tmux select-layout -t Miyabi:1 main-horizontal
                tmux set-window-option -t Miyabi:1 main-pane-height 25
                tmux select-layout -t Miyabi:1 main-horizontal
                log_conductor "✅ Layout: main-horizontal with large conductor pane (≥10 panes)"
            fi
            ;;
        "tiled")
            tmux select-layout -t Miyabi:1 tiled
            log_conductor "✅ Layout: tiled"
            ;;
        "horizontal")
            tmux select-layout -t Miyabi:1 main-horizontal
            tmux set-window-option -t Miyabi:1 main-pane-height 25
            tmux select-layout -t Miyabi:1 main-horizontal
            log_conductor "✅ Layout: main-horizontal"
            ;;
        "vertical")
            tmux select-layout -t Miyabi:1 main-vertical
            log_conductor "✅ Layout: main-vertical"
            ;;
        *)
            tmux select-layout -t Miyabi:1 tiled
            log_conductor "✅ Layout: tiled (default)"
            ;;
    esac

    notify_voice "レイアウト、最適化完了。" 1.0
}

# ワークロード分析に基づく動的スケーリング
auto_scale() {
    log_conductor "📈 ワークロード分析に基づく自動スケーリング開始"
    notify_voice "自動スケーリング、開始。" 1.0

    # タスクキューのサイズ確認
    local pending_tasks=0
    if [ -f "$TASK_QUEUE_FILE" ]; then
        pending_tasks=$(jq '[.tasks[] | select(.status == "pending")] | length' "$TASK_QUEUE_FILE" 2>/dev/null || echo "0")
    fi

    log_conductor "📋 保留中のタスク数: $pending_tasks"

    # 現在のCodexエージェント数
    local current_codex=$(jq '[.agents[] | select(.type == "codex") | select(.status == "active")] | length' "$AGENT_REGISTRY" 2>/dev/null || echo "4")

    log_conductor "🤖 現在のCodexエージェント数: $current_codex"

    # スケーリングロジック
    if [ "$pending_tasks" -gt 20 ] && [ "$current_codex" -lt 8 ]; then
        # タスクが多い場合、Codexを追加
        local new_count=$((pending_tasks / 5))
        if [ "$new_count" -gt 8 ]; then
            new_count=8
        fi

        local to_add=$((new_count - current_codex))

        if [ "$to_add" -gt 0 ]; then
            log_conductor "🚀 スケールアップ: ${to_add}個のCodexエージェント追加"
            notify_voice "${to_add}個のCodex、追加開始。" 1.1

            for i in $(seq 1 $to_add); do
                local new_name="Codex-$((current_codex + i))"
                add_agent "$new_name" "codex" "ai-coding-scaled"
                sleep 1
            done

            # レイアウト最適化
            optimize_layout "auto"
        fi
    elif [ "$pending_tasks" -lt 5 ] && [ "$current_codex" -gt 4 ]; then
        # タスクが少ない場合、余剰Codexを削除
        log_conductor "📉 スケールダウン検討: タスク数が少ない"
        # 実装は慎重に - 実行中のタスクがある場合は削除しない
    fi

    log_conductor "✅ 自動スケーリング完了"
}

# エージェント一覧表示
list_agents() {
    init_registry

    echo "🎭 Miyabi Orchestra - Agent Registry"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    jq -r '.agents | to_entries[] |
        "\(.key):
        - Pane: \(.value.pane_id)
        - Type: \(.value.type)
        - Role: \(.value.role)
        - Status: \(.value.status)"' "$AGENT_REGISTRY"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local total=$(jq '.agents | length' "$AGENT_REGISTRY")
    local active=$(jq '[.agents[] | select(.status == "active")] | length' "$AGENT_REGISTRY")

    echo "Total Agents: $total | Active: $active"
}

# ダッシュボード表示
show_dashboard() {
    init_registry

    local total_agents=$(jq '.agents | length' "$AGENT_REGISTRY")
    local active_agents=$(jq '[.agents[] | select(.status == "active")] | length' "$AGENT_REGISTRY")
    local pending_tasks=0

    if [ -f "$TASK_QUEUE_FILE" ]; then
        pending_tasks=$(jq '[.tasks[] | select(.status == "pending")] | length' "$TASK_QUEUE_FILE" 2>/dev/null || echo "0")
    fi

    cat <<EOF
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        🎼 Conductor Autonomous Control               ┃
┃              Orchestra Dashboard                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📊 System Status:
   - Total Agents: ${total_agents}
   - Active Agents: ${active_agents}
   - Pending Tasks: ${pending_tasks}

🎯 Recent Actions:
EOF

    tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/   /'

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# メイン実行
case "${1:-help}" in
    add)
        if [ $# -lt 3 ]; then
            echo "Usage: $0 add <agent_name> <agent_type> [role]"
            echo ""
            echo "Agent Types: codex, claude, codegen, review, deploy"
            exit 1
        fi
        add_agent "$2" "$3" "${4:-general}"
        ;;
    remove)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 remove <agent_name>"
            exit 1
        fi
        remove_agent "$2"
        ;;
    optimize)
        optimize_layout "${2:-auto}"
        ;;
    scale)
        auto_scale
        ;;
    list)
        list_agents
        ;;
    dashboard)
        show_dashboard
        ;;
    init)
        init_registry
        echo "✅ Agent Registry initialized: $AGENT_REGISTRY"
        ;;
    *)
        cat <<EOF
🎼 Conductor Autonomous Control - Usage

Commands:
  add <name> <type> [role]  - Add new agent
  remove <name>             - Remove agent
  optimize [layout]         - Optimize pane layout
  scale                     - Auto-scale based on workload
  list                      - List all agents
  dashboard                 - Show orchestra dashboard
  init                      - Initialize agent registry

Examples:
  $0 add Codex-5 codex ai-coding
  $0 remove Codex-3
  $0 optimize auto
  $0 optimize horizontal
  $0 scale
  $0 dashboard

Layout Types:
  auto       - Auto-select based on pane count
  tiled      - Equal-sized tiles
  horizontal - Main pane on top
  vertical   - Main pane on left
EOF
        ;;
esac
