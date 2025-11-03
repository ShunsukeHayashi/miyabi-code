#!/bin/bash
# Miyabi Orchestra - tmux Helper Library
# Purpose: Reliable tmux operations with proper timing

set -euo pipefail

# Reliable tmux send-keys with Enter confirmation
# Usage: tmux_send_keys_reliable <target_pane> <message> [retry_count]
# Returns: 0 on success, 1 on failure
tmux_send_keys_reliable() {
    local target="$1"
    local message="$2"
    local max_retries="${3:-3}"

    for attempt in $(seq 1 "$max_retries"); do
        # Send message
        tmux send-keys -t "$target" "$message" 2>/dev/null || true
        sleep 0.8  # CRITICAL: Wait for message buffer processing

        # Send Enter key (multiple times for reliability)
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3

        # Verify delivery (check for prompt or execution indicators)
        local output=$(tmux capture-pane -t "$target" -p 2>/dev/null | tail -5)

        if echo "$output" | grep -q "❯\|>\|⏺"; then
            return 0
        fi

        # Retry with exponential backoff
        sleep "$((attempt * 1))"
    done

    return 1
}

# Send command with interrupt (C-c) before sending
# Usage: tmux_send_with_interrupt <target_pane> <message> [retry_count]
tmux_send_with_interrupt() {
    local target="$1"
    local message="$2"
    local max_retries="${3:-3}"

    for attempt in $(seq 1 "$max_retries"); do
        # Clear existing input
        tmux send-keys -t "$target" C-c 2>/dev/null || true
        sleep 0.5  # Wait for interrupt processing

        # Send message
        tmux send-keys -t "$target" "$message" 2>/dev/null || true
        sleep 0.8  # CRITICAL: Wait before Enter

        # Send Enter keys
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3
        tmux send-keys -t "$target" Enter 2>/dev/null || true
        sleep 0.3

        # Verify execution started
        local output=$(tmux capture-pane -t "$target" -p 2>/dev/null | tail -10)

        if echo "$output" | grep -q -E "⏺|Thought|Read|Edit|Bash|Skill"; then
            return 0
        fi

        sleep "$((attempt * 1))"
    done

    return 1
}

# Capture pane output
# Usage: tmux_capture_pane <target_pane> [line_count]
# Returns: captured output
tmux_capture_pane() {
    local target="$1"
    local lines="${2:-10}"

    tmux capture-pane -t "$target" -p 2>/dev/null | tail -"$lines"
}

# Check if pane is responsive (has prompt)
# Usage: tmux_pane_is_responsive <target_pane>
# Returns: 0 if responsive, 1 if not
tmux_pane_is_responsive() {
    local target="$1"

    local output=$(tmux_capture_pane "$target" 5)

    if echo "$output" | grep -q "bypass permissions\|❯\|>"; then
        return 0
    else
        return 1
    fi
}

# Send ping and wait for response
# Usage: tmux_ping_pane <target_pane> <agent_name> [timeout]
# Returns: 0 if response received, 1 if timeout
tmux_ping_pane() {
    local target="$1"
    local agent_name="$2"
    local timeout="${3:-30}"

    local ping_message="[$agent_name] ping応答OK と発言してください。（${timeout}秒以内）"

    # Send ping
    if ! tmux_send_keys_reliable "$target" "$ping_message"; then
        return 1
    fi

    # Wait for response
    local elapsed=0
    while [ "$elapsed" -lt "$timeout" ]; do
        local output=$(tmux_capture_pane "$target" 10)

        if echo "$output" | grep -q "ping応答OK"; then
            return 0
        fi

        sleep 5
        elapsed=$((elapsed + 5))
    done

    return 1
}

# Clear pane with /clear command
# Usage: tmux_clear_pane <target_pane>
tmux_clear_pane() {
    local target="$1"

    tmux send-keys -t "$target" "/clear" 2>/dev/null || true
    sleep 0.5  # Wait before Enter
    tmux send-keys -t "$target" Enter 2>/dev/null || true
    sleep 2  # Wait for clear to complete
}

# Split window and return new pane ID
# Usage: tmux_split_window <session_name> <orientation> <size_percent>
# orientation: -h (horizontal) or -v (vertical)
# Returns: new pane ID
tmux_split_window() {
    local session="$1"
    local orientation="$2"
    local size="${3:-50}"

    tmux split-window -t "$session" "$orientation" -p "$size" -P -F "#{pane_id}"
}

# Set pane title
# Usage: tmux_set_pane_title <target_pane> <title>
tmux_set_pane_title() {
    local target="$1"
    local title="$2"

    tmux select-pane -t "$target" -T "$title" 2>/dev/null || true
}

# Export functions
export -f tmux_send_keys_reliable
export -f tmux_send_with_interrupt
export -f tmux_capture_pane
export -f tmux_pane_is_responsive
export -f tmux_ping_pane
export -f tmux_clear_pane
export -f tmux_split_window
export -f tmux_set_pane_title
