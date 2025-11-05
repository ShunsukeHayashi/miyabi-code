#!/bin/bash
# Miyabi Task Assignment Script v4.0
# 4-window Orchestra対応版

set -euo pipefail

# カラー定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# パス定義
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly PANE_MAPPING="$PROJECT_ROOT/.ai/config/pane-mapping.json"
readonly TASKS_JSON="$PROJECT_ROOT/.ai/queue/tasks.json"

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# pane-mapping.jsonからAgentのpane IDを取得
get_agent_pane() {
    local agent_name="$1"

    if [ ! -f "$PANE_MAPPING" ]; then
        log_error "pane-mapping.json not found at $PANE_MAPPING"
        return 1
    fi

    local pane_id=$(jq -r --arg agent "$agent_name" '.agent_to_pane[$agent] // empty' "$PANE_MAPPING")

    if [ -z "$pane_id" ]; then
        log_error "Agent '$agent_name' not found in pane mapping"
        return 1
    fi

    echo "$pane_id"
}

# Issueのラベルに基づいてAgentを選択
select_agent_by_labels() {
    local labels="$1"

    # ラベルベースのAgent選択ロジック
    if echo "$labels" | grep -q "type:bug"; then
        echo "カエデ"
    elif echo "$labels" | grep -q "type:feature"; then
        echo "カエデ"
    elif echo "$labels" | grep -q "area:ui"; then
        echo "カエデ"
    elif echo "$labels" | grep -q "area:desktop"; then
        echo "カエデ"
    elif echo "$labels" | grep -q "workflow:review"; then
        echo "サクラ"
    elif echo "$labels" | grep -q "workflow:pr"; then
        echo "ツバキ"
    elif echo "$labels" | grep -q "workflow:deployment"; then
        echo "ボタン"
    elif echo "$labels" | grep -q "workflow:triage"; then
        echo "キキョウ"
    elif echo "$labels" | grep -q "business"; then
        echo "カスミ"
    elif echo "$labels" | grep -q "content"; then
        echo "モミジ"
    elif echo "$labels" | grep -q "analytics"; then
        echo "アヤメ"
    else
        # デフォルト: カエデ
        echo "カエデ"
    fi
}

# Issueのタイトルに基づいてAgentを選択（ラベルがない場合）
select_agent_by_title() {
    local title="$1"

    if echo "$title" | grep -iq "bug\|fix\|error"; then
        echo "カエデ"
    elif echo "$title" | grep -iq "feature\|implement\|add"; then
        echo "カエデ"
    elif echo "$title" | grep -iq "review\|refactor"; then
        echo "サクラ"
    elif echo "$title" | grep -iq "pr\|pull request"; then
        echo "ツバキ"
    elif echo "$title" | grep -iq "deploy\|release"; then
        echo "ボタン"
    elif echo "$title" | grep -iq "ui\|desktop\|frontend"; then
        echo "カエデ"
    elif echo "$title" | grep -iq "market\|business"; then
        echo "カスミ"
    elif echo "$title" | grep -iq "content\|blog\|article"; then
        echo "モミジ"
    elif echo "$title" | grep -iq "analytics\|data"; then
        echo "アヤメ"
    else
        echo "カエデ"
    fi
}

# Agentにタスクを割り当て
assign_task_to_agent() {
    local issue_number="$1"
    local agent_name="$2"
    local issue_title="${3:-}"

    log_info "Assigning Issue #$issue_number to $agent_name"

    # Pane ID取得
    local pane_id
    pane_id=$(get_agent_pane "$agent_name")
    if [ $? -ne 0 ]; then
        log_error "Failed to get pane ID for $agent_name"
        return 1
    fi

    log_info "Target pane: $pane_id"

    # Paneが存在するか確認
    if ! tmux list-panes -a -F "#{pane_id}" | grep -q "^$pane_id$"; then
        log_error "Pane $pane_id does not exist"
        return 1
    fi

    # Paneのプロセスを確認
    local pane_process
    pane_process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}')

    if [ "$pane_process" != "codex" ]; then
        log_warn "Pane $pane_id is running '$pane_process' instead of 'codex' (Codex CLI)"
        log_warn "Attempting to restart Codex..."

        # Codex再起動
        tmux send-keys -t "$pane_id" C-c
        sleep 0.5
        tmux send-keys -t "$pane_id" "cd '$PROJECT_ROOT' && codex" && sleep 0.1 && tmux send-keys -t "$pane_id" Enter
        sleep 3
    fi

    # タスク指示メッセージ作成
    local message="あなたは ${agent_name} です。Issue #${issue_number} に取り組んでください。"
    if [ -n "$issue_title" ]; then
        message="${message} Title: ${issue_title}"
    fi
    message="${message} まず、Issue の詳細を確認して、実装計画を立ててください。"

    # メッセージ送信
    log_info "Sending task to $agent_name..."
    tmux send-keys -t "$pane_id" "$message" && sleep 0.1 && tmux send-keys -t "$pane_id" Enter

    log_success "Task assigned to $agent_name (pane: $pane_id)"

    # tasks.json更新
    update_tasks_json "$issue_number" "$agent_name" "$pane_id"
}

# tasks.json更新
update_tasks_json() {
    local issue_number="$1"
    local agent_name="$2"
    local pane_id="$3"

    if [ ! -f "$TASKS_JSON" ]; then
        log_warn "tasks.json not found, creating new one"
        cat > "$TASKS_JSON" <<EOF
{
  "version": "4.0.0",
  "mode": "AUTO_ACTIVE",
  "architecture": "4-window",
  "active_tasks": []
}
EOF
    fi

    # 既存タスクを確認
    local existing_task
    existing_task=$(jq --arg issue "$issue_number" '.active_tasks[] | select(.issue_number == ($issue | tonumber))' "$TASKS_JSON")

    if [ -n "$existing_task" ]; then
        log_info "Updating existing task entry for Issue #$issue_number"
        # 既存エントリを更新
        jq --arg issue "$issue_number" \
           --arg agent "$agent_name" \
           --arg pane "$pane_id" \
           '(.active_tasks[] | select(.issue_number == ($issue | tonumber))) |= {
               task_id: .task_id,
               issue_number: ($issue | tonumber),
               assigned_to: $agent,
               pane: $pane,
               status: "instruction_sent",
               assigned_at: (now | strftime("%Y-%m-%dT%H:%M:%S"))
           }' "$TASKS_JSON" > "${TASKS_JSON}.tmp"
        mv "${TASKS_JSON}.tmp" "$TASKS_JSON"
    else
        log_info "Creating new task entry for Issue #$issue_number"
        # 新規エントリ追加
        local task_id="AUTO-$(date +%s)"
        jq --arg task_id "$task_id" \
           --arg issue "$issue_number" \
           --arg agent "$agent_name" \
           --arg pane "$pane_id" \
           '.active_tasks += [{
               task_id: $task_id,
               issue_number: ($issue | tonumber),
               assigned_to: $agent,
               pane: $pane,
               status: "instruction_sent",
               assigned_at: (now | strftime("%Y-%m-%dT%H:%M:%S"))
           }]' "$TASKS_JSON" > "${TASKS_JSON}.tmp"
        mv "${TASKS_JSON}.tmp" "$TASKS_JSON"
    fi

    log_success "tasks.json updated"
}

# メイン処理
main() {
    log_info "Miyabi Task Assignment Script v4.0"
    log_info "Architecture: 4-window Orchestra"
    echo ""

    # 引数チェック
    if [ $# -lt 1 ]; then
        log_error "Usage: $0 <issue_number> [agent_name]"
        log_info "Example: $0 688"
        log_info "Example: $0 688 カエデ"
        exit 1
    fi

    local issue_number="$1"
    local agent_name="${2:-}"

    # Agent名が指定されていない場合、Issueから推測
    if [ -z "$agent_name" ]; then
        log_info "Agent not specified, fetching Issue #$issue_number from GitHub..."

        # GitHub CLIでIssue情報取得
        if ! command -v gh &> /dev/null; then
            log_error "GitHub CLI (gh) not found"
            exit 1
        fi

        local issue_data
        issue_data=$(gh issue view "$issue_number" --json title,labels 2>/dev/null || true)

        if [ -z "$issue_data" ]; then
            log_error "Failed to fetch Issue #$issue_number"
            exit 1
        fi

        local issue_title
        issue_title=$(echo "$issue_data" | jq -r '.title')

        local issue_labels
        issue_labels=$(echo "$issue_data" | jq -r '.labels[].name' | tr '\n' ',' || echo "")

        log_info "Issue Title: $issue_title"
        log_info "Labels: $issue_labels"

        # Agent選択
        if [ -n "$issue_labels" ]; then
            agent_name=$(select_agent_by_labels "$issue_labels")
            log_info "Selected agent by labels: $agent_name"
        else
            agent_name=$(select_agent_by_title "$issue_title")
            log_info "Selected agent by title: $agent_name"
        fi
    fi

    # タスク割り当て実行
    assign_task_to_agent "$issue_number" "$agent_name" "${issue_title:-}"

    echo ""
    log_success "Task assignment completed!"
    log_info "Agent: $agent_name"
    log_info "Issue: #$issue_number"
    log_info "Check tasks.json for details: $TASKS_JSON"
}

# スクリプト実行
main "$@"
