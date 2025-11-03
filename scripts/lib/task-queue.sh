#!/bin/bash
# Miyabi Orchestra - Task Queue Management Library
# Purpose: Centralized task queue operations with file locking

set -euo pipefail

WORKING_DIR="${WORKING_DIR:-/Users/shunsuke/Dev/miyabi-private}"
TASK_QUEUE_FILE="${TASK_QUEUE_FILE:-$WORKING_DIR/.ai/queue/tasks.json}"
LOCK_FILE="${TASK_QUEUE_FILE}.lock"
LOCK_TIMEOUT=10

# Acquire lock with timeout
# Usage: acquire_lock
# Returns: 0 on success, 1 on timeout
acquire_lock() {
    local waited=0

    while [ $waited -lt $LOCK_TIMEOUT ]; do
        if mkdir "$LOCK_FILE" 2>/dev/null; then
            return 0
        fi

        sleep 0.5
        waited=$((waited + 1))
    done

    return 1
}

# Release lock
# Usage: release_lock
release_lock() {
    rmdir "$LOCK_FILE" 2>/dev/null || true
}

# Get next pending task from queue (highest priority first)
# Usage: get_next_task_from_queue
# Returns: issue_number or empty string
get_next_task_from_queue() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo ""
        return
    fi

    if ! acquire_lock; then
        echo "" >&2
        return 1
    fi

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

    release_lock
    echo "$next_task"
}

# Update task status
# Usage: update_task_status <issue_number> <status> [agent_name]
# status: pending, in_progress, completed, failed
update_task_status() {
    local task_id="$1"
    local new_status="$2"
    local agent_name="${3:-}"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        return 1
    fi

    if ! acquire_lock; then
        return 1
    fi

    local tmp_file="${TASK_QUEUE_FILE}.tmp"

    case "$new_status" in
        "in_progress")
            jq --arg id "$task_id" --arg status "$new_status" --arg agent "$agent_name" \
                '(.tasks[] | select(.issue_number == $id) | .status) = $status |
                 (.tasks[] | select(.issue_number == $id) | .assigned_agent) = $agent |
                 (.tasks[] | select(.issue_number == $id) | .started_at) = now | todate' \
                "$TASK_QUEUE_FILE" > "$tmp_file"
            ;;
        "completed")
            jq --arg id "$task_id" --arg status "$new_status" \
                '(.tasks[] | select(.issue_number == $id) | .status) = $status |
                 (.tasks[] | select(.issue_number == $id) | .completed_at) = now | todate' \
                "$TASK_QUEUE_FILE" > "$tmp_file"
            ;;
        "failed")
            jq --arg id "$task_id" --arg status "$new_status" \
                '(.tasks[] | select(.issue_number == $id) | .status) = $status |
                 (.tasks[] | select(.issue_number == $id) | .failed_at) = now | todate' \
                "$TASK_QUEUE_FILE" > "$tmp_file"
            ;;
        *)
            jq --arg id "$task_id" --arg status "$new_status" \
                '(.tasks[] | select(.issue_number == $id) | .status) = $status' \
                "$TASK_QUEUE_FILE" > "$tmp_file"
            ;;
    esac

    mv "$tmp_file" "$TASK_QUEUE_FILE"

    # Update last_updated timestamp
    jq '.last_updated = now | todate' "$TASK_QUEUE_FILE" > "$tmp_file"
    mv "$tmp_file" "$TASK_QUEUE_FILE"

    release_lock
    return 0
}

# Get task info by issue number
# Usage: get_task_info <issue_number>
# Returns: JSON object with task details
get_task_info() {
    local task_id="$1"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo "{}"
        return
    fi

    jq -r ".tasks[] | select(.issue_number == \"$task_id\")" "$TASK_QUEUE_FILE" 2>/dev/null || echo "{}"
}

# Get current task for agent
# Usage: get_agent_current_task "カエデ"
# Returns: issue_number or empty string
get_agent_current_task() {
    local agent_name="$1"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo ""
        return
    fi

    jq -r ".tasks[] | select(.assigned_agent == \"$agent_name\" and .status == \"in_progress\") | .issue_number" \
        "$TASK_QUEUE_FILE" 2>/dev/null | head -1
}

# Count pending tasks
# Usage: count_pending_tasks
# Returns: number of pending tasks
count_pending_tasks() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo "0"
        return
    fi

    jq '[.tasks[] | select(.status == "pending")] | length' "$TASK_QUEUE_FILE" 2>/dev/null || echo "0"
}

# Count tasks by status
# Usage: count_tasks_by_status <status>
# Returns: number of tasks with that status
count_tasks_by_status() {
    local status="$1"

    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo "0"
        return
    fi

    jq --arg status "$status" '[.tasks[] | select(.status == $status)] | length' \
        "$TASK_QUEUE_FILE" 2>/dev/null || echo "0"
}

# List all tasks (for debugging)
# Usage: list_all_tasks
list_all_tasks() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        echo "No task queue file found"
        return
    fi

    jq -r '.tasks[] | "\(.issue_number)|\(.status)|\(.assigned_agent // "unassigned")|\(.priority)|\(.title)"' \
        "$TASK_QUEUE_FILE" 2>/dev/null | \
        column -t -s '|' -N "Issue,Status,Agent,Priority,Title"
}

# Initialize task queue file if it doesn't exist
# Usage: initialize_task_queue
initialize_task_queue() {
    if [ ! -f "$TASK_QUEUE_FILE" ]; then
        mkdir -p "$(dirname "$TASK_QUEUE_FILE")"
        cat > "$TASK_QUEUE_FILE" <<'EOF'
{
  "tasks": [],
  "created_at": "",
  "last_updated": ""
}
EOF
        jq '.created_at = now | todate | .last_updated = now | todate' "$TASK_QUEUE_FILE" > "${TASK_QUEUE_FILE}.tmp"
        mv "${TASK_QUEUE_FILE}.tmp" "$TASK_QUEUE_FILE"
    fi
}

# Export functions
export -f acquire_lock
export -f release_lock
export -f get_next_task_from_queue
export -f update_task_status
export -f get_task_info
export -f get_agent_current_task
export -f count_pending_tasks
export -f count_tasks_by_status
export -f list_all_tasks
export -f initialize_task_queue
