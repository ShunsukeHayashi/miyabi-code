#!/usr/bin/env bash
# ============================================================
# Miyabi A2A Communication Scripts (Legacy Bash 3.2 Support)
# Version: 2.1.0
# Protocol: MIYABI-A2A-P2.0
# ============================================================

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------
CONDUCTOR_PANE="${MIYABI_CONDUCTOR_PANE:-%101}"
LOG_FILE="${MIYABI_A2A_LOG:-$HOME/.miyabi/logs/a2a.log}"
RETRY_COUNT=3
RETRY_DELAY=1

# ------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------

# Ensure log directory exists
ensure_log_dir() {
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Log message
log_message() {
    ensure_log_dir
    echo "$(date -Iseconds 2>/dev/null || date) $*" >> "$LOG_FILE"
}

# Check if pane exists
pane_exists() {
    local pane=$1
    tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${pane}$"
}

# Get pane ID from agent name (Legacy compatibility)
get_pane_id() {
    local agent=$1

    case "$agent" in
        "しきるん"|"shikiroon"|"conductor")
            echo "${MIYABI_CONDUCTOR_PANE:-%101}"
            ;;
        "楓"|"カエデ"|"kaede"|"codegen")
            echo "${MIYABI_CODEGEN_PANE:-%102}"
            ;;
        "桜"|"サクラ"|"sakura"|"review")
            echo "${MIYABI_REVIEW_PANE:-%103}"
            ;;
        "椿"|"ツバキ"|"tsubaki"|"pr")
            echo "${MIYABI_PR_PANE:-%104}"
            ;;
        "牡丹"|"ボタン"|"botan"|"deploy")
            echo "${MIYABI_DEPLOY_PANE:-%105}"
            ;;
        *)
            echo "$agent"  # Assume it's already a pane ID
            ;;
    esac
}

# ------------------------------------------------------------
# Core Communication Functions
# ------------------------------------------------------------

# Send message with P0.2 protocol
# Usage: a2a_send <pane_id> <message>
a2a_send() {
    local pane=$1
    local message=$2
    local retry=0

    # Validate inputs
    if [ -z "$pane" ] || [ -z "$message" ]; then
        log_message "ERROR: Invalid parameters - pane:$pane message:$message"
        return 1
    fi

    while [ $retry -lt $RETRY_COUNT ]; do
        if tmux send-keys -t "$pane" "$message" 2>/dev/null && \
           sleep 0.5 && \
           tmux send-keys -t "$pane" Enter 2>/dev/null; then
            log_message "SENT to $pane: $message"
            return 0
        fi

        retry=$((retry + 1))
        log_message "RETRY $retry/$RETRY_COUNT for $pane"
        sleep $RETRY_DELAY
    done

    log_message "FAILED to send to $pane after $RETRY_COUNT retries"
    return 1
}

# ------------------------------------------------------------
# Agent Communication Functions
# ------------------------------------------------------------

# Report to Conductor
# Usage: a2a_report <agent_name> <status> <message>
a2a_report() {
    local agent=$1
    local status=$2
    local message=$3

    a2a_send "$CONDUCTOR_PANE" "[$agent] $status: $message"
}

# Relay between agents
# Usage: a2a_relay <from_agent> <to_agent> <action> <detail>
a2a_relay() {
    local from_agent=$1
    local to_agent=$2
    local action=$3
    local detail=$4

    local to_pane=$(get_pane_id "$to_agent")
    a2a_send "$to_pane" "[$from_agent→$to_agent] $action: $detail"
}

# Status report helpers
a2a_started() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "STARTED" "$message"
}

a2a_progress() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "PROGRESS" "$message"
}

a2a_completed() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "COMPLETED" "$message"
}

a2a_error() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "ERROR" "$message"
}

a2a_waiting() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "WAITING" "$message"
}

a2a_confirm() {
    local agent=$1
    local message=$2
    a2a_report "$agent" "CONFIRM" "$message"
}

# Health check all agents
a2a_health() {
    local agents=("conductor:$CONDUCTOR_PANE" "codegen:${MIYABI_CODEGEN_PANE:-%102}" "review:${MIYABI_REVIEW_PANE:-%103}" "pr:${MIYABI_PR_PANE:-%104}" "deploy:${MIYABI_DEPLOY_PANE:-%105}")

    echo "=== Miyabi A2A Health Check ==="
    for agent_pane in "${agents[@]}"; do
        local agent="${agent_pane%:*}"
        local pane="${agent_pane#*:}"

        if pane_exists "$pane"; then
            echo "✅ $agent ($pane): OK"
        else
            echo "❌ $agent ($pane): NOT_FOUND"
        fi
    done
}

# Broadcast to all agents
a2a_broadcast() {
    local message=$1
    local agents=("${MIYABI_CONDUCTOR_PANE:-%101}" "${MIYABI_CODEGEN_PANE:-%102}" "${MIYABI_REVIEW_PANE:-%103}" "${MIYABI_PR_PANE:-%104}" "${MIYABI_DEPLOY_PANE:-%105}")

    for pane in "${agents[@]}"; do
        a2a_send "$pane" "[Broadcast] $message"
    done
}

# ------------------------------------------------------------
# CLI Interface
# ------------------------------------------------------------

case "${1:-}" in
    "send")
        if [ $# -lt 3 ]; then
            echo "Usage: $0 send <pane_id> <message>"
            exit 1
        fi
        a2a_send "$2" "$3"
        ;;
    "report")
        if [ $# -lt 4 ]; then
            echo "Usage: $0 report <agent> <status> <message>"
            exit 1
        fi
        a2a_report "$2" "$3" "$4"
        ;;
    "relay")
        if [ $# -lt 5 ]; then
            echo "Usage: $0 relay <from> <to> <action> <detail>"
            exit 1
        fi
        a2a_relay "$2" "$3" "$4" "$5"
        ;;
    "started"|"progress"|"completed"|"error"|"waiting"|"confirm")
        if [ $# -lt 3 ]; then
            echo "Usage: $0 $1 <agent> <message>"
            exit 1
        fi
        "a2a_$1" "$2" "$3"
        ;;
    "health")
        a2a_health
        ;;
    "broadcast")
        if [ $# -lt 2 ]; then
            echo "Usage: $0 broadcast <message>"
            exit 1
        fi
        a2a_broadcast "$2"
        ;;
    *)
        echo "Miyabi A2A Communication Scripts (Legacy Bash 3.2 Support)"
        echo "Usage: $0 {send|report|relay|started|progress|completed|error|waiting|confirm|health|broadcast} [args...]"
        echo
        echo "Examples:"
        echo "  $0 send %0 'Test message'"
        echo "  $0 report kaede 開始 'Starting task'"
        echo "  $0 health"
        echo "  $0 broadcast 'System maintenance'"
        exit 1
        ;;
esac