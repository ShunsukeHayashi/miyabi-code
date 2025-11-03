#!/bin/bash
# Agent State Monitor & Auto-Restart Listener
# Purpose: Continuously monitor Agent states and trigger auto-restart on stop detection
# Usage: Run in background as daemon

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
STATE_FILE="$WORKING_DIR/.ai/state/agent-states.json"
LOG_FILE="$WORKING_DIR/.ai/logs/agent-state-monitor.log"
MONITOR_INTERVAL=10  # Check every 10 seconds

# Agent pane mapping
declare -A AGENT_PANES=(
    ["サクラ"]="%74"
    ["カエデ"]="%2"
    ["ユキ"]="%10"
    ["ハナ"]="%7"
    ["モミジ"]="%11"
    ["ツバキ"]="%63"
)

log_event() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [StateMonitor] $1" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [StateMonitor] $1"
}

# Check if Agent pane is running Claude Code
is_agent_running() {
    local pane_id="$1"
    local process=$(tmux display-message -t "$pane_id" -p "#{pane_current_command}" 2>/dev/null)

    if [ "$process" = "node" ]; then
        return 0  # Running (node = Claude Code)
    else
        return 1  # Not running
    fi
}

# Check if Agent is idle (waiting for input)
is_agent_idle() {
    local pane_id="$1"
    local last_line=$(tmux capture-pane -t "$pane_id" -p | tail -1)

    # Check for input prompt pattern
    if echo "$last_line" | grep -qE "(⏵⏵|>|Enter to select|Type something)"; then
        return 0  # Idle (waiting for input)
    else
        return 1  # Active (working)
    fi
}

# Auto-restart Agent
auto_restart_agent() {
    local agent_name="$1"
    local pane_id="$2"

    log_event "🔄 Auto-restart triggered for $agent_name ($pane_id)"

    # Restart Claude Code
    tmux send-keys -t "$pane_id" "cd '/Users/shunsuke/Dev/miyabi-private' && claude" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$pane_id" Enter 2>/dev/null

    log_event "✅ Claude Code restarted for $agent_name"

    # Wait for Claude Code to start
    sleep 3

    # Request next task automatically
    local task_request="Orchestratorへ: タスク完了しました。次の優先タスク(P0-Critical)を自動取得して作業を開始します。gh issue listから最も優先度の高いIssueを選択して実装してください。"

    tmux send-keys -t "$pane_id" "$task_request" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$pane_id" Enter 2>/dev/null

    log_event "📋 Task request sent to $agent_name"

    # Update state file
    update_state "$agent_name" "RUNNING" "$pane_id"

    # VOICEVOX notification
    if command -v python3 &> /dev/null && [ -f "$WORKING_DIR/tools/send-voicevox-message.py" ]; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "$agent_name、自動再起動なのだ。次のタスクを取得中なのだ。" \
            3 \
            1.0 &
    fi
}

# Update agent state in state file
update_state() {
    local agent_name="$1"
    local status="$2"
    local pane_id="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$STATE_FILE")"

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg name "$agent_name" \
           --arg status "$status" \
           --arg ts "$timestamp" \
           --arg pane "$pane_id" \
           '.last_updated = $ts | .agents[$name] = {status: $status, timestamp: $ts, pane: $pane}' \
           "$STATE_FILE" > "$temp_file" 2>/dev/null || echo "{\"version\":\"1.0.0\",\"last_updated\":\"$timestamp\",\"agents\":{}}" > "$temp_file"
        mv "$temp_file" "$STATE_FILE"
    fi
}

# Main monitoring loop
main() {
    log_event "🚀 Agent State Monitor & Auto-Restart Listener started"
    log_event "📊 Monitoring ${#AGENT_PANES[@]} agents every ${MONITOR_INTERVAL}s"

    # Initialize state file
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"version":"1.0.0","last_updated":"","agents":{}}' > "$STATE_FILE"
    fi

    while true; do
        for agent_name in "${!AGENT_PANES[@]}"; do
            pane_id="${AGENT_PANES[$agent_name]}"

            # Check if pane exists
            if ! tmux has-session -t "Miyabi" 2>/dev/null || ! tmux list-panes -t "Miyabi" -a | grep -q "$pane_id"; then
                log_event "⚠️ Pane $pane_id ($agent_name) not found - skipping"
                continue
            fi

            # Check if Agent is running
            if ! is_agent_running "$pane_id"; then
                log_event "🛑 Agent $agent_name ($pane_id) STOPPED - triggering auto-restart"
                update_state "$agent_name" "STOPPED" "$pane_id"
                auto_restart_agent "$agent_name" "$pane_id"

            elif is_agent_idle "$pane_id"; then
                # Agent is running but idle - might need task assignment
                log_event "💤 Agent $agent_name ($pane_id) IDLE - monitoring"
                update_state "$agent_name" "IDLE" "$pane_id"

            else
                # Agent is running and active
                update_state "$agent_name" "RUNNING" "$pane_id"
            fi
        done

        # Wait before next check
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle signals for graceful shutdown
trap 'log_event "🛑 Agent State Monitor shutting down"; exit 0' SIGINT SIGTERM

# Start monitoring
main
