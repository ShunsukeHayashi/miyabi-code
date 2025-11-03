#!/bin/bash
# Miyabi Orchestra - Task Scheduler Daemon
# GitHub Issuesを自動監視し、適切なAgentに割り当て

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Message Queueをロード
source "$SCRIPT_DIR/miyabi-message-queue.sh"

# 設定
POLL_INTERVAL=${MIYABI_SCHEDULER_INTERVAL:-60}
LOG_FILE="${MIYABI_SCHEDULER_LOG:-logs/scheduler/task-scheduler.log}"
STATE_FILE="data/scheduler-state.json"

# GitHub設定
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO="${GITHUB_REPOSITORY:-customer-cloud/miyabi-private}"

# ============================================================================
# ログ関数
# ============================================================================

sched_log() {
    local level=$1
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE" >&2
}

sched_log_info() {
    sched_log "INFO" "$@"
}

sched_log_error() {
    sched_log "ERROR" "$@"
}

sched_log_debug() {
    if [[ "${MIYABI_DEBUG:-0}" == "1" ]]; then
        sched_log "DEBUG" "$@"
    fi
}

# ============================================================================
# 初期化
# ============================================================================

init_scheduler() {
    sched_log_info "Initializing Task Scheduler..."

    # ディレクトリ作成
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$STATE_FILE")"

    # Message Queue初期化
    init_queue

    # ステートファイル作成
    if [[ ! -f "$STATE_FILE" ]]; then
        echo '{"last_check": 0, "processed_issues": []}' > "$STATE_FILE"
    fi

    sched_log_info "Task Scheduler initialized"
}

# ============================================================================
# 未割り当てIssue取得
# ============================================================================

fetch_unassigned_issues() {
    if ! command -v gh &> /dev/null; then
        sched_log_error "GitHub CLI (gh) not found"
        return 1
    fi

    # GitHub CLI で未割り当てIssueを取得
    local issues
    if ! issues=$(gh issue list \
        --repo "$REPO" \
        --label "status:todo" \
        --json number,title,labels,body \
        --jq '.[]' 2>&1); then
        sched_log_error "Failed to fetch issues: $issues"
        return 1
    fi

    echo "$issues"
}

# ============================================================================
# Issueラベルに基づいてAgentを選択
# ============================================================================

select_agent_for_issue() {
    local labels=$1

    # ラベルをパースしてAgent選択
    # 優先順位: type:bug > type:enhancement > status:review > status:ready-pr > status:deploy

    if echo "$labels" | jq -e '.[] | select(.name == "type:bug")' > /dev/null 2>&1; then
        echo "kaede"
    elif echo "$labels" | jq -e '.[] | select(.name == "type:enhancement")' > /dev/null 2>&1; then
        echo "kaede"
    elif echo "$labels" | jq -e '.[] | select(.name == "type:feature")' > /dev/null 2>&1; then
        echo "kaede"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:review")' > /dev/null 2>&1; then
        echo "sakura"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:ready-pr")' > /dev/null 2>&1; then
        echo "tsubaki"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:deploy")' > /dev/null 2>&1; then
        echo "botan"
    else
        # デフォルトはカエデ（CodeGen）
        echo "kaede"
    fi
}

# ============================================================================
# IssueがAgent割り当て済みかチェック
# ============================================================================

is_issue_assigned() {
    local labels=$1

    # assigned:* ラベルが付いているかチェック
    if echo "$labels" | jq -e '.[] | select(.name | startswith("assigned:"))' > /dev/null 2>&1; then
        return 0  # 割り当て済み
    else
        return 1  # 未割り当て
    fi
}

# ============================================================================
# IssueをAgentに割り当て
# ============================================================================

assign_issue_to_agent() {
    local issue_number=$1
    local issue_title=$2
    local issue_body=$3
    local agent=$4

    sched_log_info "Assigning Issue #$issue_number to $agent: $issue_title"

    # Message Queue経由でAgentに通知
    local payload
    payload=$(jq -n \
        --arg issue "$issue_number" \
        --arg title "$issue_title" \
        --arg body "$issue_body" \
        '{issue: $issue, title: $title, body: $body}')

    if send_message "scheduler" "$agent" "task_request" "$payload"; then
        sched_log_info "Task sent to $agent via Message Queue"
    else
        sched_log_error "Failed to send message to $agent"
        return 1
    fi

    # GitHubにラベル追加
    if gh issue edit "$issue_number" \
        --repo "$REPO" \
        --add-label "assigned:$agent,status:in-progress" 2>&1; then
        sched_log_info "GitHub labels updated for Issue #$issue_number"
    else
        sched_log_error "Failed to update GitHub labels for Issue #$issue_number"
    fi

    # ステートファイルに記録
    update_state "$issue_number"

    return 0
}

# ============================================================================
# ステートファイル更新
# ============================================================================

update_state() {
    local issue_number=$1
    local current_time=$(date +%s)

    # ステートファイルを読み込み
    local state
    state=$(cat "$STATE_FILE")

    # 更新
    local new_state
    new_state=$(echo "$state" | jq \
        --arg time "$current_time" \
        --arg issue "$issue_number" \
        '.last_check = ($time | tonumber) | .processed_issues += [$issue]')

    echo "$new_state" > "$STATE_FILE"
}

# ============================================================================
# 処理済みIssueチェック
# ============================================================================

is_issue_processed() {
    local issue_number=$1

    if [[ ! -f "$STATE_FILE" ]]; then
        return 1  # 未処理
    fi

    local state
    state=$(cat "$STATE_FILE")

    if echo "$state" | jq -e ".processed_issues | index(\"$issue_number\")" > /dev/null 2>&1; then
        return 0  # 処理済み
    else
        return 1  # 未処理
    fi
}

# ============================================================================
# スケジューラメインループ
# ============================================================================

scheduler_main_loop() {
    sched_log_info "Task Scheduler started (poll interval: ${POLL_INTERVAL}s)"
    sched_log_info "Repository: $REPO"

    local iteration=0

    while true; do
        ((iteration++))
        sched_log_info "=== Iteration $iteration: Checking for new issues ==="

        # 未割り当てIssue取得
        local issues
        if ! issues=$(fetch_unassigned_issues); then
            sched_log_error "Failed to fetch issues, retrying in ${POLL_INTERVAL}s..."
            sleep "$POLL_INTERVAL"
            continue
        fi

        if [[ -z "$issues" ]]; then
            sched_log_info "No unassigned issues found"
        else
            local count=0

            # 各Issueを処理
            while IFS= read -r issue; do
                if [[ -z "$issue" ]]; then
                    continue
                fi

                local issue_number issue_title issue_labels issue_body

                issue_number=$(echo "$issue" | jq -r '.number')
                issue_title=$(echo "$issue" | jq -r '.title')
                issue_labels=$(echo "$issue" | jq -c '.labels')
                issue_body=$(echo "$issue" | jq -r '.body // ""')

                # 既に処理済みかチェック
                if is_issue_processed "$issue_number"; then
                    sched_log_debug "Issue #$issue_number already processed, skipping"
                    continue
                fi

                # 既にAgent割り当て済みかチェック
                if is_issue_assigned "$issue_labels"; then
                    sched_log_debug "Issue #$issue_number already assigned, skipping"
                    update_state "$issue_number"
                    continue
                fi

                # Agent選択
                local agent
                agent=$(select_agent_for_issue "$issue_labels")

                sched_log_info "Selected agent for Issue #$issue_number: $agent"

                # 割り当て
                if assign_issue_to_agent "$issue_number" "$issue_title" "$issue_body" "$agent"; then
                    ((count++))
                fi

            done <<< "$issues"

            if [[ $count -gt 0 ]]; then
                sched_log_info "Assigned $count issue(s) in this iteration"
            fi
        fi

        sched_log_info "Next check in ${POLL_INTERVAL}s..."
        sleep "$POLL_INTERVAL"
    done
}

# ============================================================================
# テストモード
# ============================================================================

run_scheduler_test() {
    sched_log_info "Running scheduler in test mode (one iteration only)"

    init_scheduler

    # 1回だけ実行
    local issues
    issues=$(fetch_unassigned_issues)

    if [[ -z "$issues" ]]; then
        echo "No unassigned issues found"
        return 0
    fi

    echo "Found unassigned issues:"
    echo "$issues" | jq -r '.number, .title' | paste - - | while read -r num title; do
        echo "  #$num: $title"
    done

    return 0
}

# ============================================================================
# ステータス表示
# ============================================================================

show_status() {
    echo "=== Miyabi Task Scheduler Status ==="
    echo ""
    echo "Repository: $REPO"
    echo "Poll Interval: ${POLL_INTERVAL}s"
    echo "Log File: $LOG_FILE"
    echo ""

    if [[ -f "$STATE_FILE" ]]; then
        local state
        state=$(cat "$STATE_FILE")

        local last_check processed_count
        last_check=$(echo "$state" | jq -r '.last_check')
        processed_count=$(echo "$state" | jq -r '.processed_issues | length')

        if [[ $last_check -gt 0 ]]; then
            local last_check_date
            last_check_date=$(date -d "@$last_check" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
            echo "Last Check: $last_check_date"
        else
            echo "Last Check: Never"
        fi

        echo "Processed Issues: $processed_count"
    else
        echo "State File: Not initialized"
    fi

    echo ""

    # Message Queue状態
    "$SCRIPT_DIR/miyabi-message-queue.sh" status
}

# ============================================================================
# メイン処理
# ============================================================================

main() {
    local command=${1:-help}

    case $command in
        start)
            init_scheduler
            scheduler_main_loop
            ;;
        test)
            run_scheduler_test
            ;;
        status)
            show_status
            ;;
        help|*)
            cat << EOF
Miyabi Orchestra - Task Scheduler

Usage: $0 <command>

Commands:
  start   - Start task scheduler daemon
  test    - Run in test mode (one iteration)
  status  - Show scheduler status
  help    - Show this help

Environment Variables:
  MIYABI_SCHEDULER_INTERVAL  - Poll interval in seconds (default: 60)
  MIYABI_SCHEDULER_LOG       - Log file path
  GITHUB_TOKEN               - GitHub API token
  GITHUB_REPOSITORY          - Repository (default: customer-cloud/miyabi-private)
  MIYABI_DEBUG               - Enable debug logging (0 or 1)

Examples:
  # Start scheduler daemon
  $0 start

  # Test mode (one iteration)
  $0 test

  # Show status
  $0 status

  # Run with custom interval
  MIYABI_SCHEDULER_INTERVAL=30 $0 start
EOF
            ;;
    esac
}

# スクリプトとして実行された場合のみmainを呼ぶ
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
