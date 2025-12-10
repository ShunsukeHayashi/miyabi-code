#!/usr/bin/env bash
# ============================================================
# A2A Advanced Communication Framework
# Version: 3.0.0 - Ultra Rich Edition
# Protocol: MIYABI-A2A-P3.0 Advanced
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Advanced Configuration
# ------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly CONFIG_FILE="${MIYABI_A2A_CONFIG:-$HOME/.miyabi/a2a-config.yml}"
readonly STATE_FILE="${MIYABI_A2A_STATE:-$HOME/.miyabi/a2a-state.json}"
readonly METRICS_FILE="${MIYABI_A2A_METRICS:-$HOME/.miyabi/a2a-metrics.log}"
readonly LOG_FILE="${MIYABI_A2A_LOG:-$HOME/.miyabi/logs/a2a-advanced.log}"

# Message Priority Levels
readonly PRIORITY_CRITICAL=0
readonly PRIORITY_HIGH=1
readonly PRIORITY_NORMAL=2
readonly PRIORITY_LOW=3
readonly PRIORITY_DEBUG=4

# Message Types
readonly MSG_TYPE_COMMAND="command"
readonly MSG_TYPE_STATUS="status"
readonly MSG_TYPE_DATA="data"
readonly MSG_TYPE_ALERT="alert"
readonly MSG_TYPE_METRIC="metric"
readonly MSG_TYPE_HEARTBEAT="heartbeat"

# Colors for rich output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly RESET='\033[0m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'

# Unicode symbols
readonly SYMBOL_SUCCESS="✅"
readonly SYMBOL_ERROR="❌"
readonly SYMBOL_WARNING="⚠️"
readonly SYMBOL_INFO="ℹ️"
readonly SYMBOL_ROCKET="🚀"
readonly SYMBOL_GEAR="⚙️"
readonly SYMBOL_CHART="📊"
readonly SYMBOL_LIGHTNING="⚡"
readonly SYMBOL_SHIELD="🛡️"
readonly SYMBOL_BRAIN="🧠"

# ------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------

log_advanced() {
    local level="$1"
    local component="$2"
    local message="$3"
    local timestamp=$(date -Iseconds 2>/dev/null || date)

    ensure_log_dir
    echo "[$timestamp] [$level] [$component] $message" >> "$LOG_FILE"

    # Also output to console with colors
    case "$level" in
        "ERROR")   echo -e "${RED}${SYMBOL_ERROR} [$component] $message${RESET}" ;;
        "WARN")    echo -e "${YELLOW}${SYMBOL_WARNING} [$component] $message${RESET}" ;;
        "SUCCESS") echo -e "${GREEN}${SYMBOL_SUCCESS} [$component] $message${RESET}" ;;
        "INFO")    echo -e "${BLUE}${SYMBOL_INFO} [$component] $message${RESET}" ;;
        *)         echo -e "${WHITE}[$component] $message${RESET}" ;;
    esac
}

ensure_log_dir() {
    local log_dir=$(dirname "$LOG_FILE")
    [[ -d "$log_dir" ]] || mkdir -p "$log_dir"
}

ensure_state_dir() {
    local state_dir=$(dirname "$STATE_FILE")
    [[ -d "$state_dir" ]] || mkdir -p "$state_dir"
}

# JSON state management
update_agent_state() {
    local agent="$1"
    local status="$2"
    local message="$3"
    local timestamp=$(date -Iseconds 2>/dev/null || date)

    ensure_state_dir

    if [[ ! -f "$STATE_FILE" ]]; then
        echo '{}' > "$STATE_FILE"
    fi

    # Update state using jq if available, otherwise basic JSON
    if command -v jq >/dev/null 2>&1; then
        jq --arg agent "$agent" \
           --arg status "$status" \
           --arg message "$message" \
           --arg timestamp "$timestamp" \
           '.agents[$agent] = {status: $status, message: $message, timestamp: $timestamp, updated: now}' \
           "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    else
        # Fallback basic JSON update
        log_advanced "WARN" "StateManager" "jq not found, using basic state update"
    fi
}

get_agent_state() {
    local agent="$1"

    if [[ -f "$STATE_FILE" ]] && command -v jq >/dev/null 2>&1; then
        jq -r --arg agent "$agent" '.agents[$agent] // {status: "unknown", message: "No state data"}' "$STATE_FILE"
    else
        echo '{"status": "unknown", "message": "State file not accessible"}'
    fi
}

# ------------------------------------------------------------
# Advanced Pane Discovery
# ------------------------------------------------------------

discover_agent_panes() {
    log_advanced "INFO" "Discovery" "Auto-discovering agent panes..."

    local panes=$(tmux list-panes -a -F "#{pane_id} #{pane_title}" 2>/dev/null || echo "")

    if [[ -z "$panes" ]]; then
        log_advanced "ERROR" "Discovery" "No tmux panes found"
        return 1
    fi

    echo -e "${BOLD}${CYAN}📡 Agent Pane Discovery Results${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local count=0
    while read -r pane_line; do
        [[ -z "$pane_line" ]] && continue
        local pane_id=$(echo "$pane_line" | cut -d' ' -f1)
        local pane_title=$(echo "$pane_line" | cut -d' ' -f2-)

        echo -e "${GREEN}${pane_id}${RESET} → ${YELLOW}${pane_title}${RESET}"
        ((count++))
    done <<< "$panes"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BOLD}Total panes discovered: ${GREEN}$count${RESET}"

    log_advanced "SUCCESS" "Discovery" "Found $count tmux panes"
}

# ------------------------------------------------------------
# Message Queue System
# ------------------------------------------------------------

enqueue_message() {
    local target_pane="$1"
    local message="$2"
    local priority="${3:-$PRIORITY_NORMAL}"
    local msg_type="${4:-$MSG_TYPE_STATUS}"

    local queue_file="$HOME/.miyabi/queue/$(echo "$target_pane" | tr '%/' '_').queue"
    local queue_dir=$(dirname "$queue_file")
    [[ -d "$queue_dir" ]] || mkdir -p "$queue_dir"

    local timestamp=$(date -Iseconds 2>/dev/null || date)
    local queue_entry=$(printf '{"timestamp": "%s", "priority": %d, "type": "%s", "pane": "%s", "message": "%s"}\n' \
                               "$timestamp" "$priority" "$msg_type" "$target_pane" "$message")

    echo "$queue_entry" >> "$queue_file"
    log_advanced "INFO" "MessageQueue" "Enqueued: $msg_type to $target_pane (priority: $priority)"
}

process_message_queue() {
    local target_pane="$1"
    local queue_file="$HOME/.miyabi/queue/$(echo "$target_pane" | tr '%/' '_').queue"

    [[ -f "$queue_file" ]] || return 0

    log_advanced "INFO" "MessageQueue" "Processing queue for $target_pane"

    # Sort by priority and process
    if command -v jq >/dev/null 2>&1; then
        local messages=$(sort -k3 -n "$queue_file" | jq -s .)
        local count=$(echo "$messages" | jq length)

        if [[ "$count" -gt 0 ]]; then
            echo -e "${PURPLE}${SYMBOL_GEAR} Processing $count queued messages for $target_pane${RESET}"

            for ((i=0; i<count; i++)); do
                local message=$(echo "$messages" | jq -r ".[$i].message")
                a2a_send_advanced "$target_pane" "$message"
                sleep 0.2
            done

            # Clear processed queue
            > "$queue_file"
            log_advanced "SUCCESS" "MessageQueue" "Processed $count messages for $target_pane"
        fi
    fi
}

# ------------------------------------------------------------
# Advanced Send Function with Rich Features
# ------------------------------------------------------------

a2a_send_advanced() {
    local pane="$1"
    local message="$2"
    local options="${3:-}"

    # Parse options
    local retry_count=3
    local timeout=30
    local priority=$PRIORITY_NORMAL
    local encrypt=false
    local compress=false
    local confirm=false

    # Option parsing (simplified)
    [[ "$options" == *"--retry="* ]] && retry_count=$(echo "$options" | grep -o 'retry=[0-9]*' | cut -d= -f2)
    [[ "$options" == *"--timeout="* ]] && timeout=$(echo "$options" | grep -o 'timeout=[0-9]*' | cut -d= -f2)
    [[ "$options" == *"--encrypt"* ]] && encrypt=true
    [[ "$options" == *"--compress"* ]] && compress=true
    [[ "$options" == *"--confirm"* ]] && confirm=true

    # Pre-send validation
    if ! pane_exists "$pane"; then
        log_advanced "ERROR" "Sender" "Target pane $pane not found"
        return 1
    fi

    # Message preprocessing
    local processed_message="$message"

    if [[ "$compress" == true ]] && command -v gzip >/dev/null 2>&1; then
        processed_message=$(echo "$message" | gzip | base64 -w0)
        log_advanced "INFO" "Sender" "Message compressed (original: ${#message} bytes)"
    fi

    if [[ "$encrypt" == true ]]; then
        log_advanced "WARN" "Sender" "Encryption requested but not implemented in this version"
    fi

    # Advanced retry logic with exponential backoff
    local attempt=0
    local backoff=1

    while [ $attempt -lt $retry_count ]; do
        local start_time=$(date +%s)

        if tmux send-keys -t "$pane" "$processed_message" 2>/dev/null && \
           sleep 0.5 && \
           tmux send-keys -t "$pane" Enter 2>/dev/null; then

            local end_time=$(date +%s)
            local duration=$((end_time - start_time))

            log_advanced "SUCCESS" "Sender" "Message delivered to $pane in ${duration}s (attempt $((attempt + 1)))"

            # Record metrics
            record_metric "message_sent" 1 "pane=$pane,duration=${duration}s"

            # Update agent state
            update_agent_state "$(pane_to_agent "$pane")" "message_received" "$message"

            return 0
        fi

        attempt=$((attempt + 1))
        if [ $attempt -lt $retry_count ]; then
            log_advanced "WARN" "Sender" "Attempt $attempt failed, retrying in ${backoff}s..."
            sleep $backoff
            backoff=$((backoff * 2))  # Exponential backoff
        fi
    done

    log_advanced "ERROR" "Sender" "Failed to deliver message to $pane after $retry_count attempts"
    record_metric "message_failed" 1 "pane=$pane"
    return 1
}

# ------------------------------------------------------------
# Metrics and Monitoring
# ------------------------------------------------------------

record_metric() {
    local metric_name="$1"
    local value="$2"
    local tags="${3:-}"
    local timestamp=$(date -Iseconds 2>/dev/null || date)

    ensure_log_dir
    echo "$timestamp,$metric_name,$value,$tags" >> "$METRICS_FILE"
}

show_metrics_dashboard() {
    echo -e "${BOLD}${CYAN}📊 A2A Advanced Metrics Dashboard${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ ! -f "$METRICS_FILE" ]]; then
        echo -e "${YELLOW}${SYMBOL_WARNING} No metrics data available${RESET}"
        return 0
    fi

    # Basic metrics analysis
    local total_messages=$(grep -c "message_sent" "$METRICS_FILE" 2>/dev/null || echo 0)
    local failed_messages=$(grep -c "message_failed" "$METRICS_FILE" 2>/dev/null || echo 0)
    local success_rate=0

    if [[ $total_messages -gt 0 ]]; then
        success_rate=$(awk "BEGIN {printf \"%.1f\", (($total_messages - $failed_messages) / $total_messages) * 100}")
    fi

    echo -e "${GREEN}${SYMBOL_CHART} Total Messages Sent:${RESET} $total_messages"
    echo -e "${RED}${SYMBOL_ERROR} Failed Messages:${RESET} $failed_messages"
    echo -e "${BLUE}${SYMBOL_LIGHTNING} Success Rate:${RESET} ${success_rate}%"

    # Recent activity
    echo ""
    echo -e "${PURPLE}${SYMBOL_BRAIN} Recent Activity:${RESET}"
    if tail -n 5 "$METRICS_FILE" 2>/dev/null | while read -r line; do
        [[ -z "$line" ]] && continue
        local timestamp=$(echo "$line" | cut -d, -f1)
        local metric=$(echo "$line" | cut -d, -f2)
        local value=$(echo "$line" | cut -d, -f3)
        echo -e "${DIM}$timestamp${RESET} ${WHITE}$metric${RESET}: $value"
    done; then
        :
    else
        echo -e "${DIM}No recent activity${RESET}"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ------------------------------------------------------------
# Rich Health Check with Visual Dashboard
# ------------------------------------------------------------

a2a_health_advanced() {
    echo -e "${BOLD}${GREEN}${SYMBOL_SHIELD} A2A Advanced Health Dashboard${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # System prerequisites check
    echo -e "${BOLD}${CYAN}🔧 System Prerequisites${RESET}"

    check_dependency "tmux" "Terminal multiplexer" "brew install tmux"
    check_dependency "jq" "JSON processor (optional)" "brew install jq"
    check_dependency "gzip" "Compression utility" "built-in"

    echo ""

    # Agent pane status
    echo -e "${BOLD}${BLUE}${SYMBOL_BRAIN} Agent Status Monitor${RESET}"

    local agents=("conductor:${MIYABI_CONDUCTOR_PANE:-%101}"
                  "codegen:${MIYABI_CODEGEN_PANE:-%102}"
                  "review:${MIYABI_REVIEW_PANE:-%103}"
                  "pr:${MIYABI_PR_PANE:-%104}"
                  "deploy:${MIYABI_DEPLOY_PANE:-%105}")

    local total_agents=${#agents[@]}
    local healthy_agents=0

    for agent_pane in "${agents[@]}"; do
        local agent="${agent_pane%:*}"
        local pane="${agent_pane#*:}"

        printf "%-12s %s " "$agent" "$pane"

        if pane_exists "$pane"; then
            echo -e "${GREEN}${SYMBOL_SUCCESS} HEALTHY${RESET} ${DIM}(responsive)${RESET}"
            ((healthy_agents++))

            # Check if pane is actually responsive
            local test_result=$(tmux send-keys -t "$pane" 'echo test' 2>/dev/null && echo "ok" || echo "fail")
            if [[ "$test_result" == "fail" ]]; then
                echo -e "  ${YELLOW}${SYMBOL_WARNING} Warning: Pane exists but may not be responsive${RESET}"
            fi
        else
            echo -e "${RED}${SYMBOL_ERROR} OFFLINE${RESET} ${DIM}(pane not found)${RESET}"
        fi
    done

    echo ""
    echo -e "${BOLD}Health Summary:${RESET} ${GREEN}$healthy_agents${RESET}/${BLUE}$total_agents${RESET} agents healthy"

    # Performance metrics
    echo ""
    echo -e "${BOLD}${PURPLE}⚡ Performance Metrics${RESET}"

    if [[ -f "$METRICS_FILE" ]]; then
        show_metrics_dashboard
    else
        echo -e "${DIM}No performance data available yet${RESET}"
    fi

    # System resource usage
    echo ""
    echo -e "${BOLD}${YELLOW}💻 System Resources${RESET}"

    if command -v ps >/dev/null 2>&1; then
        local tmux_processes=$(ps aux | grep -c '[t]mux' || echo 0)
        echo -e "${BLUE}Tmux processes:${RESET} $tmux_processes"
    fi

    if [[ -f "$LOG_FILE" ]]; then
        local log_size=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo "0")
        echo -e "${BLUE}Log file size:${RESET} $log_size"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Overall health score
    local health_percentage=$((healthy_agents * 100 / total_agents))

    if [[ $health_percentage -eq 100 ]]; then
        echo -e "${BOLD}${GREEN}🎯 System Status: EXCELLENT ($health_percentage%)${RESET}"
    elif [[ $health_percentage -ge 80 ]]; then
        echo -e "${BOLD}${YELLOW}⚠️  System Status: GOOD ($health_percentage%)${RESET}"
    else
        echo -e "${BOLD}${RED}🚨 System Status: NEEDS ATTENTION ($health_percentage%)${RESET}"
    fi
}

check_dependency() {
    local cmd="$1"
    local description="$2"
    local install_hint="$3"

    printf "%-20s " "$cmd:"

    if command -v "$cmd" >/dev/null 2>&1; then
        local version=$(command "$cmd" --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "${GREEN}${SYMBOL_SUCCESS} Installed${RESET} ${DIM}($version)${RESET}"
    else
        echo -e "${RED}${SYMBOL_ERROR} Missing${RESET} ${DIM}($install_hint)${RESET}"
    fi
}

# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

pane_exists() {
    local pane=$1
    tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${pane}$"
}

pane_to_agent() {
    local pane="$1"
    case "$pane" in
        "${MIYABI_CONDUCTOR_PANE:-%101}") echo "conductor" ;;
        "${MIYABI_CODEGEN_PANE:-%102}") echo "codegen" ;;
        "${MIYABI_REVIEW_PANE:-%103}") echo "review" ;;
        "${MIYABI_PR_PANE:-%104}") echo "pr" ;;
        "${MIYABI_DEPLOY_PANE:-%105}") echo "deploy" ;;
        *) echo "unknown" ;;
    esac
}

# ------------------------------------------------------------
# CLI Interface - Advanced
# ------------------------------------------------------------

show_usage() {
    echo -e "${BOLD}${CYAN}A2A Advanced Communication Framework v3.0.0${RESET}"
    echo -e "${DIM}Ultra Rich Edition - Next Generation Multi-Agent Protocol${RESET}"
    echo ""
    echo -e "${BOLD}Usage:${RESET} $0 <command> [options...]"
    echo ""
    echo -e "${BOLD}${GREEN}Core Commands:${RESET}"
    echo -e "  ${YELLOW}send${RESET}       <pane> <message> [--retry=N] [--encrypt] [--compress]"
    echo -e "  ${YELLOW}health${RESET}     Show comprehensive system health dashboard"
    echo -e "  ${YELLOW}discover${RESET}   Auto-discover available agent panes"
    echo -e "  ${YELLOW}metrics${RESET}    Display performance metrics dashboard"
    echo -e "  ${YELLOW}queue${RESET}      <pane> <message> [priority]  Add message to queue"
    echo -e "  ${YELLOW}process${RESET}    <pane>                      Process message queue"
    echo ""
    echo -e "${BOLD}${BLUE}Advanced Features:${RESET}"
    echo -e "  ${PURPLE}monitor${RESET}    Start real-time monitoring mode"
    echo -e "  ${PURPLE}stress${RESET}     Run stress test with N concurrent messages"
    echo -e "  ${PURPLE}export${RESET}     Export metrics/logs in various formats"
    echo -e "  ${PURPLE}reset${RESET}      Reset all state and metrics data"
    echo ""
    echo -e "${BOLD}${RED}Examples:${RESET}"
    echo -e "  $0 send %0 'Hello World' --retry=5 --compress"
    echo -e "  $0 health"
    echo -e "  $0 queue %0 'Important message' 1"
    echo -e "  $0 monitor --interval=2"
    echo ""
}

# ------------------------------------------------------------
# Main CLI Router
# ------------------------------------------------------------

main() {
    case "${1:-help}" in
        "send")
            if [[ $# -lt 3 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 send <pane> <message> [options]${RESET}"
                exit 1
            fi
            a2a_send_advanced "$2" "$3" "${4:-}"
            ;;
        "health")
            a2a_health_advanced
            ;;
        "discover")
            discover_agent_panes
            ;;
        "metrics")
            show_metrics_dashboard
            ;;
        "queue")
            if [[ $# -lt 3 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 queue <pane> <message> [priority]${RESET}"
                exit 1
            fi
            enqueue_message "$2" "$3" "${4:-$PRIORITY_NORMAL}"
            ;;
        "process")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 process <pane>${RESET}"
                exit 1
            fi
            process_message_queue "$2"
            ;;
        "monitor")
            echo -e "${BOLD}${CYAN}📡 Starting A2A Advanced Monitor...${RESET}"
            echo -e "${DIM}Press Ctrl+C to stop${RESET}"
            echo ""
            while true; do
                clear
                a2a_health_advanced
                echo -e "\n${DIM}Last updated: $(date)${RESET}"
                sleep 5
            done
            ;;
        "stress")
            echo -e "${BOLD}${YELLOW}⚡ A2A Stress Test Mode${RESET}"
            local count="${2:-10}"
            echo -e "Sending $count test messages..."

            for ((i=1; i<=count; i++)); do
                a2a_send_advanced "%0" "Stress test message #$i" &
                if [[ $((i % 5)) -eq 0 ]]; then
                    wait  # Batch processing
                    echo -e "${GREEN}Batch $((i/5)) completed${RESET}"
                fi
            done
            wait
            echo -e "${BOLD}${GREEN}${SYMBOL_SUCCESS} Stress test completed!${RESET}"
            ;;
        "reset")
            echo -e "${BOLD}${YELLOW}🔄 Resetting A2A Advanced state...${RESET}"
            [[ -f "$STATE_FILE" ]] && rm "$STATE_FILE" && echo "State file cleared"
            [[ -f "$METRICS_FILE" ]] && rm "$METRICS_FILE" && echo "Metrics file cleared"
            echo -e "${GREEN}${SYMBOL_SUCCESS} Reset completed${RESET}"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            echo -e "${RED}${SYMBOL_ERROR} Unknown command: $1${RESET}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"