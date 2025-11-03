#!/usr/bin/env bash
# Miyabi System Health Monitor - Machine Resource & Memory Leak Prevention
# Purpose: Monitor system resources and prevent catastrophic failures
# Mission: Prevent machine crashes due to resource exhaustion
# Requires: bash 4.0+ (use /usr/local/bin/bash or /opt/homebrew/bin/bash on macOS)

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
HEALTH_LOG="$WORKING_DIR/.ai/logs/system-health.log"
HEALTH_STATE="$WORKING_DIR/.ai/state/system-health.json"
ALERT_LOG="$WORKING_DIR/.ai/logs/system-alerts.log"

CHECK_INTERVAL=30  # Check every 30 seconds
MEMORY_CRITICAL_THRESHOLD=85  # Alert if memory usage > 85%
MEMORY_EMERGENCY_THRESHOLD=95  # Emergency cleanup if > 95%
CPU_THRESHOLD=90  # Alert if CPU usage > 90%
DISK_THRESHOLD=90  # Alert if disk usage > 90%

# Process memory leak detection (using temporary files instead of associative arrays for compatibility)
MEMORY_LEAK_DETECTION_CYCLES=5  # Consecutive growth cycles to detect leak

log_event() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [HealthMonitor] $message" >> "$HEALTH_LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message"
}

log_critical_alert() {
    local component="$1"
    local metric="$2"
    local value="$3"
    local action="$4"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CRITICAL] $component: $metric = $value | Action: $action" >> "$ALERT_LOG"
    log_event "CRITICAL" "$component $metric critical: $value - Taking action: $action"

    # VOICEVOX critical alert
    if command -v python3 &> /dev/null && [ -f "$WORKING_DIR/tools/send-voicevox-message.py" ]; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "緊急警告！システムリソース異常なのだ！$component が危険な状態なのだ！" \
            3 \
            1.3 &
    fi
}

# Get current memory usage percentage
get_memory_usage() {
    local mem_info=$(vm_stat | grep "Pages")
    local free_pages=$(echo "$mem_info" | awk '/Pages free/ {print $3}' | tr -d '.')
    local inactive_pages=$(echo "$mem_info" | awk '/Pages inactive/ {print $3}' | tr -d '.')
    local speculative_pages=$(echo "$mem_info" | awk '/Pages speculative/ {print $3}' | tr -d '.')
    local wired_pages=$(echo "$mem_info" | awk '/Pages wired down/ {print $4}' | tr -d '.')
    local active_pages=$(echo "$mem_info" | awk '/Pages active/ {print $3}' | tr -d '.')

    local page_size=4096
    local free_mem=$(( (free_pages + inactive_pages + speculative_pages) * page_size / 1024 / 1024 ))
    local used_mem=$(( (wired_pages + active_pages) * page_size / 1024 / 1024 ))
    local total_mem=$(( free_mem + used_mem ))

    if [ $total_mem -gt 0 ]; then
        local usage_percent=$(( used_mem * 100 / total_mem ))
        echo "$usage_percent"
    else
        echo "0"
    fi
}

# Get current CPU usage percentage
get_cpu_usage() {
    local cpu_usage=$(top -l 1 | awk '/CPU usage/ {print $3}' | tr -d '%')
    echo "${cpu_usage:-0}"
}

# Get disk usage percentage
get_disk_usage() {
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    echo "${disk_usage:-0}"
}

# Get process memory usage in MB
get_process_memory() {
    local pid="$1"
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "0"
        return
    fi

    local mem_kb=$(ps -o rss= -p "$pid" 2>/dev/null || echo "0")
    local mem_mb=$(( mem_kb / 1024 ))
    echo "$mem_mb"
}

# Detect memory leak in process (simplified for bash 3.x compatibility)
detect_memory_leak() {
    local process_name="$1"
    local pid=$(pgrep -f "$process_name" | head -1)

    if [ -z "$pid" ]; then
        return 1  # Process not running
    fi

    local current_mem=$(get_process_memory "$pid")

    # Use file-based state for compatibility
    local state_dir="$WORKING_DIR/.ai/state/memory-tracking"
    mkdir -p "$state_dir"
    local baseline_file="$state_dir/${process_name//\//_}.baseline"
    local growth_file="$state_dir/${process_name//\//_}.growth"

    # Initialize baseline if not exists
    if [ ! -f "$baseline_file" ]; then
        echo "$current_mem" > "$baseline_file"
        echo "0" > "$growth_file"
        return 0
    fi

    local baseline_mem=$(cat "$baseline_file" 2>/dev/null || echo "0")
    local growth_count=$(cat "$growth_file" 2>/dev/null || echo "0")

    # Ensure numeric values
    current_mem=${current_mem:-0}
    baseline_mem=${baseline_mem:-0}
    growth_count=${growth_count:-0}

    # Safe arithmetic operation
    local mem_growth=0
    if [[ "$current_mem" =~ ^[0-9]+$ ]] && [[ "$baseline_mem" =~ ^[0-9]+$ ]]; then
        mem_growth=$(( current_mem - baseline_mem ))
    fi

    if [ $mem_growth -gt 100 ]; then  # 100MB threshold
        # Memory is growing
        growth_count=$(( growth_count + 1 ))
        echo "$growth_count" > "$growth_file"

        log_event "WARNING" "Memory leak suspected: $process_name (PID: $pid) - Growth: ${mem_growth}MB (Count: $growth_count)"

        if [ $growth_count -ge $MEMORY_LEAK_DETECTION_CYCLES ]; then
            log_critical_alert "$process_name" "MEMORY_LEAK_DETECTED" "${mem_growth}MB" "Restarting process"
            # Reset tracking
            echo "$current_mem" > "$baseline_file"
            echo "0" > "$growth_file"
            return 2  # Memory leak detected
        fi
    else
        # Memory stable or decreasing
        echo "0" > "$growth_file"
        echo "$current_mem" > "$baseline_file"
    fi

    return 0
}

# Emergency memory cleanup
emergency_memory_cleanup() {
    log_critical_alert "System Memory" "CRITICAL" ">${MEMORY_EMERGENCY_THRESHOLD}%" "Emergency cleanup"

    # 1. Clear system cache
    sudo purge 2>/dev/null || log_event "WARNING" "Failed to purge system cache (requires sudo)"

    # 2. Kill low-priority processes (if any)
    # Add logic here if needed

    # 3. Restart Claude Code instances that are idle
    log_event "INFO" "Restarting idle Claude Code sessions to free memory"

    # Get list of idle Claude Code processes
    local state_file="$WORKING_DIR/.ai/state/agent-states.json"
    if [ -f "$state_file" ] && command -v jq &> /dev/null; then
        jq -r '.agents | to_entries[] | select(.value.status == "IDLE") | .value.pane' "$state_file" 2>/dev/null | while read pane_id; do
            if [ -n "$pane_id" ]; then
                log_event "INFO" "Restarting idle agent in pane $pane_id"
                tmux send-keys -t "$pane_id" C-c 2>/dev/null
                sleep 0.2
                tmux send-keys -t "$pane_id" C-c 2>/dev/null
                sleep 1
                tmux send-keys -t "$pane_id" "cd '$WORKING_DIR' && claude" 2>/dev/null
                sleep 0.5
                tmux send-keys -t "$pane_id" Enter 2>/dev/null
            fi
        done
    fi

    log_event "INFO" "Emergency cleanup completed"
}

# Handle memory leak detection
handle_memory_leak() {
    local process_name="$1"

    log_critical_alert "$process_name" "MEMORY_LEAK" "Detected" "Restarting process"

    # Restart the process based on type
    if echo "$process_name" | grep -q "water-spider"; then
        pkill -f "water-spider-monitor-v2.sh"
        sleep 2
        nohup bash "$WORKING_DIR/scripts/water-spider-monitor-v2.sh" >> "$WORKING_DIR/.ai/logs/water-spider-restart.log" 2>&1 &
        log_event "INFO" "Water Spider restarted due to memory leak"
    elif echo "$process_name" | grep -q "agent-state-monitor"; then
        pkill -f "agent-state-monitor-listener.sh"
        sleep 2
        nohup bash "$WORKING_DIR/scripts/agent-state-monitor-listener.sh" >> "$WORKING_DIR/.ai/logs/state-monitor-restart.log" 2>&1 &
        log_event "INFO" "Agent State Monitor restarted due to memory leak"
    elif echo "$process_name" | grep -q "voicevox"; then
        pkill -f "voicevox_worker.sh"
        sleep 2
        nohup bash "$WORKING_DIR/tools/voicevox_worker.sh" >> "$WORKING_DIR/.ai/logs/voicevox-restart.log" 2>&1 &
        log_event "INFO" "VOICEVOX Worker restarted due to memory leak"
    fi

    # Reset tracking files
    local state_dir="$WORKING_DIR/.ai/state/memory-tracking"
    local baseline_file="$state_dir/${process_name//\//_}.baseline"
    local growth_file="$state_dir/${process_name//\//_}.growth"
    rm -f "$baseline_file" "$growth_file"
}

# Update system health state
update_health_state() {
    local mem_usage="$1"
    local cpu_usage="$2"
    local disk_usage="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$HEALTH_STATE")"

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg ts "$timestamp" \
           --arg mem "$mem_usage" \
           --arg cpu "$cpu_usage" \
           --arg disk "$disk_usage" \
           '.last_check = $ts | .metrics = {
               memory_percent: ($mem | tonumber),
               cpu_percent: ($cpu | tonumber),
               disk_percent: ($disk | tonumber),
               timestamp: $ts
           }' \
           "$HEALTH_STATE" > "$temp_file" 2>/dev/null || \
           echo "{\"version\":\"1.0.0\",\"last_check\":\"$timestamp\",\"metrics\":{}}" > "$temp_file"
        mv "$temp_file" "$HEALTH_STATE"
    fi
}

# Main monitoring loop
main() {
    log_event "INFO" "🏥 System Health Monitor started - 24/7 Resource Management"
    log_event "INFO" "📊 Thresholds: Memory Critical: ${MEMORY_CRITICAL_THRESHOLD}%, Emergency: ${MEMORY_EMERGENCY_THRESHOLD}%"
    log_event "INFO" "📊 Thresholds: CPU: ${CPU_THRESHOLD}%, Disk: ${DISK_THRESHOLD}%"
    log_event "INFO" "🔍 Memory leak detection: Growth threshold: ${MEMORY_GROWTH_THRESHOLD}MB over $MEMORY_LEAK_DETECTION_CYCLES cycles"

    while true; do
        # Get current metrics
        local mem_usage=$(get_memory_usage)
        local cpu_usage=$(get_cpu_usage)
        local disk_usage=$(get_disk_usage)

        log_event "INFO" "📊 System Health: Memory: ${mem_usage}% | CPU: ${cpu_usage}% | Disk: ${disk_usage}%"

        # Check memory
        if [ "$mem_usage" -ge "$MEMORY_EMERGENCY_THRESHOLD" ]; then
            emergency_memory_cleanup
        elif [ "$mem_usage" -ge "$MEMORY_CRITICAL_THRESHOLD" ]; then
            log_critical_alert "System Memory" "HIGH_USAGE" "${mem_usage}%" "Monitoring closely"
        fi

        # Check CPU
        if [ "${cpu_usage%.*}" -ge "$CPU_THRESHOLD" ]; then
            log_critical_alert "System CPU" "HIGH_USAGE" "${cpu_usage}%" "Monitoring closely"
        fi

        # Check Disk
        if [ "$disk_usage" -ge "$DISK_THRESHOLD" ]; then
            log_critical_alert "System Disk" "HIGH_USAGE" "${disk_usage}%" "Cleanup recommended"
        fi

        # Detect memory leaks in critical processes
        for process in "water-spider-monitor-v2.sh" "agent-state-monitor-listener.sh" "voicevox_worker.sh"; do
            detect_memory_leak "$process"
            local result=$?
            if [ $result -eq 2 ]; then
                # Memory leak detected
                handle_memory_leak "$process"
            fi
        done

        # Update state
        update_health_state "$mem_usage" "$cpu_usage" "$disk_usage"

        # Wait before next check
        sleep "$CHECK_INTERVAL"
    done
}

# Handle signals
trap 'log_event "INFO" "🛑 Health Monitor shutting down"; exit 0' SIGINT SIGTERM

# Start monitoring
main
