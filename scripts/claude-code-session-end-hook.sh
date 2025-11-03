#!/bin/bash
# Claude Code Session End Hook
# Purpose: Automatically report progress to Orchestrator when Claude Code session ends
# Usage: This script is triggered by SessionEnd:compact hook

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
LOG_FILE="$WORKING_DIR/.ai/logs/session-end-hook.log"
STATE_FILE="$WORKING_DIR/.ai/state/agent-states.json"
ORCHESTRATOR_PANE="%1"  # Conductor/Orchestrator pane ID

# Get current pane information
CURRENT_PANE=$(tmux display-message -p "#{pane_id}")
PANE_TITLE=$(tmux display-message -p "#{pane_title}")
WINDOW_INDEX=$(tmux display-message -p "#{window_index}")
PANE_INDEX=$(tmux display-message -p "#{pane_index}")

# Log session end event
log_event() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SessionEnd] $1" >> "$LOG_FILE"
}

# Extract agent name from pane title
extract_agent_name() {
    local title="$1"
    case "$title" in
        *"サクラ"*) echo "サクラ" ;;
        *"カエデ"*) echo "カエデ" ;;
        *"ユキ"*) echo "ユキ" ;;
        *"ハナ"*) echo "ハナ" ;;
        *"モミジ"*) echo "モミジ" ;;
        *"ツバキ"*) echo "ツバキ" ;;
        *"アヤメ"*) echo "アヤメ" ;;
        *"スミレ"*) echo "スミレ" ;;
        *"ボタン"*) echo "ボタン" ;;
        *"カスミ"*) echo "カスミ" ;;
        *"キキョウ"*) echo "キキョウ" ;;
        *) echo "Unknown Agent" ;;
    esac
}

# Get current working status from pane
get_pane_status() {
    # Capture last 30 lines from pane to analyze current task
    local pane_content=$(tmux capture-pane -t "$CURRENT_PANE" -p -S -30)

    # Extract Issue number if present
    local issue_number=$(echo "$pane_content" | grep -oE "Issue #[0-9]+" | tail -1 | grep -oE "[0-9]+")

    # Extract task description (look for common patterns)
    local task_desc=$(echo "$pane_content" | grep -E "(実装|作業|タスク|Issue)" | tail -3 | head -1)

    # Detect if task is in progress, completed, or idle
    local status="IDLE"
    if echo "$pane_content" | grep -qE "(completed|完了|成功)"; then
        status="COMPLETED"
    elif echo "$pane_content" | grep -qE "(working|作業中|実装中|in progress)"; then
        status="IN_PROGRESS"
    elif echo "$pane_content" | grep -qE "(error|エラー|failed|失敗)"; then
        status="ERROR"
    fi

    echo "$status|$issue_number|$task_desc"
}

# Generate progress report
generate_progress_report() {
    local agent_name=$(extract_agent_name "$PANE_TITLE")
    local status_info=$(get_pane_status)
    local status=$(echo "$status_info" | cut -d'|' -f1)
    local issue_number=$(echo "$status_info" | cut -d'|' -f2)
    local task_desc=$(echo "$status_info" | cut -d'|' -f3)

    local report="【セッション終了レポート】Agent: $agent_name (Window $WINDOW_INDEX, Pane $PANE_INDEX)"

    if [ -n "$issue_number" ]; then
        report="$report | Issue #$issue_number"
    fi

    report="$report | Status: $status"

    if [ -n "$task_desc" ]; then
        report="$report | Task: $task_desc"
    fi

    echo "$report"
}

# Auto-restart Claude Code with next task request
auto_restart_with_next_task() {
    local agent_name=$(extract_agent_name "$PANE_TITLE")

    log_event "Auto-restarting Claude Code for $agent_name"

    # Wait for session to fully end
    sleep 2

    # Restart Claude Code in current pane
    tmux send-keys -t "$CURRENT_PANE" "cd '/Users/shunsuke/Dev/miyabi-private' && claude" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$CURRENT_PANE" Enter 2>/dev/null

    # Wait for Claude Code to start
    sleep 3

    # Request next task from Orchestrator
    local next_task_request="【自動タスク要求】Agent: $agent_name - 前回タスク完了。次のタスクを割り当ててください。優先度の高いIssueから自動的に取り組みます。"

    log_event "Requesting next task: $next_task_request"

    # Send next task request to current pane (self-initiate)
    tmux send-keys -t "$CURRENT_PANE" "Orchestratorへ報告: タスク完了しました。次の優先タスクを自動的に取得して作業を開始します。" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$CURRENT_PANE" Enter 2>/dev/null

    # Also notify Orchestrator
    tmux send-keys -t "$ORCHESTRATOR_PANE" "$next_task_request" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$ORCHESTRATOR_PANE" Enter 2>/dev/null

    log_event "Next task request sent to Orchestrator"

    # Update state file
    update_agent_state "$agent_name" "AUTO_RESTARTED" "$(date '+%Y-%m-%d %H:%M:%S')"

    # VOICEVOX narration
    if command -v python3 &> /dev/null && [ -f "$WORKING_DIR/tools/send-voicevox-message.py" ]; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "$agent_name、タスク完了なのだ。次のタスクを自動取得して再開するのだ。" \
            3 \
            1.0 &
    fi
}

# Update agent state in state file
update_agent_state() {
    local agent_name="$1"
    local status="$2"
    local timestamp="$3"

    # Ensure state file directory exists
    mkdir -p "$(dirname "$STATE_FILE")"

    # Update state using jq (if available) or simple append
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg name "$agent_name" \
           --arg status "$status" \
           --arg ts "$timestamp" \
           '.agents[$name] = {status: $status, timestamp: $ts, pane: env.CURRENT_PANE}' \
           "$STATE_FILE" > "$temp_file" 2>/dev/null || echo '{"version":"1.0.0","agents":{}}' > "$temp_file"
        mv "$temp_file" "$STATE_FILE"
    fi

    log_event "Agent state updated: $agent_name -> $status"
}

# Main execution
main() {
    log_event "Session ending for pane $CURRENT_PANE ($PANE_TITLE)"

    # Generate progress report
    PROGRESS_REPORT=$(generate_progress_report)

    log_event "Progress Report: $PROGRESS_REPORT"

    # Send progress report to Orchestrator pane
    # Using proper tmux send-keys syntax with sleep and Enter
    tmux send-keys -t "$ORCHESTRATOR_PANE" "$PROGRESS_REPORT" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$ORCHESTRATOR_PANE" Enter 2>/dev/null

    log_event "Progress report sent to Orchestrator ($ORCHESTRATOR_PANE)"

    # Also log to Water Spider log if available
    if [ -f "$WORKING_DIR/.ai/logs/water-spider-relay.log" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SessionEnd] $PROGRESS_REPORT" >> "$WORKING_DIR/.ai/logs/water-spider-relay.log"
    fi

    # VOICEVOX narration (optional)
    if command -v python3 &> /dev/null && [ -f "$WORKING_DIR/tools/send-voicevox-message.py" ]; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "$(extract_agent_name "$PANE_TITLE")、セッション終了なのだ。進捗報告を送信したのだ。" \
            3 \
            1.0 &
    fi

    # ⭐ AUTO-RESTART: Automatically restart Claude Code and request next task
    auto_restart_with_next_task
}

# Execute main function
main

# Exit successfully
exit 0
