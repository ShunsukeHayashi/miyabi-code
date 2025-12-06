#!/usr/bin/env bash
# ============================================================
# Miyabi A2A Communication Scripts
# Version: 2.0.0
# Protocol: MIYABI-A2A-P2.0
# ============================================================

# ------------------------------------------------------------
# Bash Version Check (Requires Bash 4+ for associative arrays)
# ------------------------------------------------------------
if ((BASH_VERSINFO[0] < 4)); then
    echo "Error: Bash 4.0 or higher is required (current: $BASH_VERSION)" >&2
    echo "Install with: brew install bash" >&2
    exit 1
fi

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------
CONDUCTOR_PANE="${MIYABI_CONDUCTOR_PANE:-%18}"
LOG_FILE="${MIYABI_A2A_LOG:-$HOME/.miyabi/logs/a2a.log}"
RETRY_COUNT=3
RETRY_DELAY=1

# Agent Pane Mapping (miyabi-main:6)
declare -A AGENT_PANES=(
    ["しきるん"]="%18"
    ["shikiroon"]="%18"
    ["conductor"]="%18"
    ["カエデ"]="%19"
    ["kaede"]="%19"
    ["codegen"]="%19"
    ["サクラ"]="%20"
    ["sakura"]="%20"
    ["review"]="%20"
    ["ツバキ"]="%21"
    ["tsubaki"]="%21"
    ["pr"]="%21"
    ["ボタン"]="%22"
    ["botan"]="%22"
    ["deploy"]="%22"
    ["みつけるん"]="%23"
    ["mitsukeroon"]="%23"
    ["issue"]="%23"
)

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
    echo "$(date -Iseconds) $*" >> "$LOG_FILE"
}

# Check if pane exists
pane_exists() {
    local pane=$1
    tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${pane}$"
}

# Get pane ID from agent name
get_pane_id() {
    local agent=$1
    echo "${AGENT_PANES[$agent]:-$agent}"
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
    local from=$1
    local to=$2
    local action=$3
    local detail=$4
    local to_pane=$(get_pane_id "$to")
    
    # Report to Conductor for audit trail
    a2a_send "$CONDUCTOR_PANE" "[$from→$to] $action: $detail"
    
    # Send to target agent
    if [ "$to_pane" != "$to" ]; then
        a2a_send "$to_pane" "$action: $detail (from $from)"
    fi
}

# Send to specific agent
# Usage: a2a_to <agent_name_or_pane> <message>
a2a_to() {
    local target=$1
    local message=$2
    local pane=$(get_pane_id "$target")
    
    a2a_send "$pane" "$message"
}

# Broadcast to all agents
# Usage: a2a_broadcast <message>
a2a_broadcast() {
    local message=$1
    
    for pane in "${AGENT_PANES[@]}"; do
        a2a_send "$pane" "📢 $message"
    done
}

# ------------------------------------------------------------
# Status Report Helpers
# ------------------------------------------------------------

# Task started
a2a_started() {
    local agent=$1
    local task=$2
    a2a_report "$agent" "開始" "$task"
}

# Task in progress
a2a_progress() {
    local agent=$1
    local percent=$2
    local detail=$3
    a2a_report "$agent" "進行中" "$percent% - $detail"
}

# Task completed
a2a_completed() {
    local agent=$1
    local result=$2
    a2a_report "$agent" "完了" "$result"
}

# Task failed
a2a_error() {
    local agent=$1
    local error=$2
    a2a_report "$agent" "エラー" "$error"
}

# Waiting for dependency
a2a_waiting() {
    local agent=$1
    local dependency=$2
    a2a_report "$agent" "待機" "$dependency"
}

# Request approval
a2a_confirm() {
    local agent=$1
    local request=$2
    a2a_report "$agent" "確認" "$request"
}

# ------------------------------------------------------------
# Monitoring Functions
# ------------------------------------------------------------

# Capture pane output
# Usage: a2a_capture <pane_id> [lines]
a2a_capture() {
    local pane=$1
    local lines=${2:-20}
    
    tmux capture-pane -t "$pane" -p | tail -n "$lines"
}

# Search errors in pane
# Usage: a2a_errors <pane_id>
a2a_errors() {
    local pane=$1
    
    tmux capture-pane -t "$pane" -p | grep -E "(error|Error|failed|panic|FAILED)"
}

# Health check all agents
a2a_health() {
    echo "=== Agent Health Check $(date) ==="
    
    for agent in "${!AGENT_PANES[@]}"; do
        pane="${AGENT_PANES[$agent]}"
        
        if pane_exists "$pane"; then
            cmd=$(tmux display-message -t "$pane" -p "#{pane_current_command}" 2>/dev/null)
            echo "✅ $agent ($pane): $cmd"
        else
            echo "❌ $agent ($pane): OFFLINE"
        fi
    done
}

# List all panes with IDs
a2a_list_panes() {
    echo "=== All Panes ==="
    tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id} #{pane_current_command}"
}

# ------------------------------------------------------------
# Interactive Mode
# ------------------------------------------------------------

# Interactive A2A shell
a2a_shell() {
    echo "🔗 Miyabi A2A Interactive Shell"
    echo "Commands: send, report, relay, broadcast, capture, health, exit"
    echo ""
    
    while true; do
        read -p "a2a> " cmd args
        
        case "$cmd" in
            send)
                read -p "Pane ID: " pane
                read -p "Message: " msg
                a2a_send "$pane" "$msg"
                ;;
            report)
                read -p "Agent: " agent
                read -p "Status: " status
                read -p "Message: " msg
                a2a_report "$agent" "$status" "$msg"
                ;;
            relay)
                read -p "From Agent: " from
                read -p "To Agent: " to
                read -p "Action: " action
                read -p "Detail: " detail
                a2a_relay "$from" "$to" "$action" "$detail"
                ;;
            broadcast)
                read -p "Message: " msg
                a2a_broadcast "$msg"
                ;;
            capture)
                read -p "Pane ID: " pane
                a2a_capture "$pane"
                ;;
            health)
                a2a_health
                ;;
            list)
                a2a_list_panes
                ;;
            exit|quit|q)
                echo "Goodbye!"
                break
                ;;
            *)
                echo "Unknown command: $cmd"
                ;;
        esac
        echo ""
    done
}

# ------------------------------------------------------------
# Main Entry Point
# ------------------------------------------------------------

# If sourced, functions are available
# If executed directly, run command

if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    case "${1:-help}" in
        send)
            shift
            a2a_send "$@"
            ;;
        report)
            shift
            a2a_report "$@"
            ;;
        relay)
            shift
            a2a_relay "$@"
            ;;
        to)
            shift
            a2a_to "$@"
            ;;
        broadcast)
            shift
            a2a_broadcast "$@"
            ;;
        started)
            shift
            a2a_started "$@"
            ;;
        progress)
            shift
            a2a_progress "$@"
            ;;
        completed)
            shift
            a2a_completed "$@"
            ;;
        error)
            shift
            a2a_error "$@"
            ;;
        waiting)
            shift
            a2a_waiting "$@"
            ;;
        confirm)
            shift
            a2a_confirm "$@"
            ;;
        capture)
            shift
            a2a_capture "$@"
            ;;
        errors)
            shift
            a2a_errors "$@"
            ;;
        health)
            a2a_health
            ;;
        list)
            a2a_list_panes
            ;;
        shell)
            a2a_shell
            ;;
        help|*)
            cat << 'EOF'
Miyabi A2A Communication Scripts
================================

Usage: a2a.sh <command> [arguments]

Communication Commands:
  send <pane_id> <message>          Send message to pane (P0.2 protocol)
  report <agent> <status> <msg>     Report to Conductor
  relay <from> <to> <action> <detail>  Relay between agents
  to <agent|pane> <message>         Send to specific agent
  broadcast <message>               Broadcast to all agents

Status Helpers:
  started <agent> <task>            Report task started
  progress <agent> <percent> <detail>  Report progress
  completed <agent> <result>        Report completion
  error <agent> <error>             Report error
  waiting <agent> <dependency>      Report waiting
  confirm <agent> <request>         Request approval

Monitoring:
  capture <pane_id> [lines]         Capture pane output
  errors <pane_id>                  Search errors in pane
  health                            Health check all agents
  list                              List all panes

Interactive:
  shell                             Start interactive shell

Examples:
  a2a.sh send %18 '[カエデ] 完了: 実装終了'
  a2a.sh completed カエデ 'Issue #270 実装完了'
  a2a.sh relay カエデ サクラ レビュー依頼 'PR #123'
  a2a.sh broadcast 'システムメンテナンス開始'
  a2a.sh health

Environment:
  MIYABI_CONDUCTOR_PANE  Conductor pane ID (default: %18)
  MIYABI_A2A_LOG         Log file path (default: ~/.miyabi/logs/a2a.log)
EOF
            ;;
    esac
fi
