#!/usr/bin/env bash
# Miyabi Ultimate Failsafe Watchdog - The Last Line of Defense
# Purpose: Monitor ALL critical infrastructure including Water Spider itself
# Mission: ABSOLUTE ZERO DOWNTIME - This watchdog watches the watchers

WORKING_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
FAILSAFE_LOG="$WORKING_DIR/.ai/logs/ultimate-failsafe.log"
FAILSAFE_STATE="$WORKING_DIR/.ai/state/ultimate-failsafe.json"
CRITICAL_ALERT_LOG="$WORKING_DIR/.ai/logs/ultimate-failsafe-alerts.log"

CHECK_INTERVAL=15  # Check every 15 seconds (more frequent than other watchdogs)
MAX_CONSECUTIVE_FAILURES=2  # Restart after 2 consecutive failures

# Critical infrastructure processes to monitor
WATER_SPIDER_SCRIPT="water-spider-monitor-v2.sh"
SYSTEM_WATCHDOG_SCRIPT="miyabi-system-watchdog.sh"
AGENT_STATE_MONITOR_SCRIPT="agent-state-monitor-listener.sh"
HEALTH_MONITOR_SCRIPT="system-health-monitor.sh"

log_event() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [UltimateFailsafe] $message" | tee -a "$FAILSAFE_LOG"
}

log_critical() {
    local component="$1"
    local action="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CRITICAL] $component - Action: $action" | tee -a "$CRITICAL_ALERT_LOG"
    log_event "CRITICAL" "$component FAILURE - Taking action: $action"

    # VOICEVOX emergency alert
    if command -v python3 &> /dev/null && [ -f "$WORKING_DIR/tools/send-voicevox-message.py" ]; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "最終防衛システム発動！$component が停止したのだ！緊急復旧開始なのだ！" \
            3 \
            1.5 &
    fi
}

# Check if process is running
is_process_running() {
    local process_name="$1"
    pgrep -f "$process_name" > /dev/null 2>&1
}

# Restart Water Spider
restart_water_spider() {
    log_critical "Water Spider" "Restarting"

    # Kill all instances first
    pkill -f "$WATER_SPIDER_SCRIPT"
    sleep 3

    # Restart
    nohup bash "$WORKING_DIR/scripts/water-spider-monitor-v2.sh" \
        >> "$WORKING_DIR/.ai/logs/water-spider-failsafe-restart.log" 2>&1 &

    sleep 5

    if is_process_running "$WATER_SPIDER_SCRIPT"; then
        log_event "INFO" "✅ Water Spider successfully restarted by Ultimate Failsafe"
        return 0
    else
        log_event "ERROR" "❌ Water Spider restart FAILED - System in critical state"
        return 1
    fi
}

# Restart System Watchdog
restart_system_watchdog() {
    log_critical "System Watchdog" "Restarting"

    pkill -f "$SYSTEM_WATCHDOG_SCRIPT"
    sleep 2

    nohup bash "$WORKING_DIR/scripts/miyabi-system-watchdog.sh" \
        >> "$WORKING_DIR/.ai/logs/watchdog-failsafe-restart.log" 2>&1 &

    sleep 3

    if is_process_running "$SYSTEM_WATCHDOG_SCRIPT"; then
        log_event "INFO" "✅ System Watchdog successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ System Watchdog restart FAILED"
        return 1
    fi
}

# Restart Agent State Monitor
restart_agent_monitor() {
    log_critical "Agent State Monitor" "Restarting"

    pkill -f "$AGENT_STATE_MONITOR_SCRIPT"
    sleep 2

    nohup bash "$WORKING_DIR/scripts/agent-state-monitor-listener.sh" \
        >> "$WORKING_DIR/.ai/logs/agent-monitor-failsafe-restart.log" 2>&1 &

    sleep 3

    if is_process_running "$AGENT_STATE_MONITOR_SCRIPT"; then
        log_event "INFO" "✅ Agent State Monitor successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ Agent State Monitor restart FAILED"
        return 1
    fi
}

# Restart Health Monitor
restart_health_monitor() {
    log_critical "Health Monitor" "Restarting"

    pkill -f "$HEALTH_MONITOR_SCRIPT"
    sleep 2

    nohup bash "$WORKING_DIR/scripts/system-health-monitor.sh" \
        >> "$WORKING_DIR/.ai/logs/health-monitor-failsafe-restart.log" 2>&1 &

    sleep 3

    if is_process_running "$HEALTH_MONITOR_SCRIPT"; then
        log_event "INFO" "✅ Health Monitor successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ Health Monitor restart FAILED"
        return 1
    fi
}

# Update failsafe state
update_state() {
    local component="$1"
    local status="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$FAILSAFE_STATE")"

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg comp "$component" \
           --arg status "$status" \
           --arg ts "$timestamp" \
           '.last_check = $ts | .components[$comp] = {
               status: $status,
               last_check: $ts,
               checks: ((.components[$comp].checks // 0) + 1),
               restarts: (if $status == "RESTARTED" then ((.components[$comp].restarts // 0) + 1) else (.components[$comp].restarts // 0) end)
           }' \
           "$FAILSAFE_STATE" > "$temp_file" 2>/dev/null || \
           echo "{\"version\":\"1.0.0\",\"last_check\":\"$timestamp\",\"components\":{}}" > "$temp_file"
        mv "$temp_file" "$FAILSAFE_STATE"
    fi
}

# Get failure count for component
get_failure_count() {
    local component="$1"
    local count_file="$WORKING_DIR/.ai/state/failsafe-failures/${component//\//_}.count"

    if [ -f "$count_file" ]; then
        cat "$count_file"
    else
        echo "0"
    fi
}

# Increment failure count
increment_failure_count() {
    local component="$1"
    local count_dir="$WORKING_DIR/.ai/state/failsafe-failures"
    mkdir -p "$count_dir"
    local count_file="$count_dir/${component//\//_}.count"

    local current=$(get_failure_count "$component")
    local new_count=$(( current + 1 ))
    echo "$new_count" > "$count_file"
    echo "$new_count"
}

# Reset failure count
reset_failure_count() {
    local component="$1"
    local count_file="$WORKING_DIR/.ai/state/failsafe-failures/${component//\//_}.count"
    echo "0" > "$count_file"
}

# Main monitoring loop
main() {
    log_event "INFO" "🛡️ Ultimate Failsafe Watchdog started - FINAL DEFENSE LINE"
    log_event "INFO" "📊 Monitoring: Water Spider, System Watchdog, Agent Monitor, Health Monitor"
    log_event "INFO" "⚡ Check interval: ${CHECK_INTERVAL}s | Max consecutive failures: $MAX_CONSECUTIVE_FAILURES"

    # Initialize state
    if [ ! -f "$FAILSAFE_STATE" ]; then
        echo '{"version":"1.0.0","last_check":"","components":{}}' > "$FAILSAFE_STATE"
    fi

    while true; do
        # Check Water Spider (HIGHEST PRIORITY)
        if ! is_process_running "$WATER_SPIDER_SCRIPT"; then
            local failures=$(increment_failure_count "$WATER_SPIDER_SCRIPT")
            log_event "WARNING" "⚠️ Water Spider NOT RUNNING (failure count: $failures)"

            if [ $failures -ge $MAX_CONSECUTIVE_FAILURES ]; then
                restart_water_spider
                if [ $? -eq 0 ]; then
                    reset_failure_count "$WATER_SPIDER_SCRIPT"
                    update_state "water_spider" "RESTARTED"
                else
                    update_state "water_spider" "FAILED"
                fi
            fi
        else
            reset_failure_count "$WATER_SPIDER_SCRIPT"
            update_state "water_spider" "RUNNING"
        fi

        # Check System Watchdog
        if ! is_process_running "$SYSTEM_WATCHDOG_SCRIPT"; then
            local failures=$(increment_failure_count "$SYSTEM_WATCHDOG_SCRIPT")
            log_event "WARNING" "⚠️ System Watchdog NOT RUNNING (failure count: $failures)"

            if [ $failures -ge $MAX_CONSECUTIVE_FAILURES ]; then
                restart_system_watchdog
                if [ $? -eq 0 ]; then
                    reset_failure_count "$SYSTEM_WATCHDOG_SCRIPT"
                    update_state "system_watchdog" "RESTARTED"
                else
                    update_state "system_watchdog" "FAILED"
                fi
            fi
        else
            reset_failure_count "$SYSTEM_WATCHDOG_SCRIPT"
            update_state "system_watchdog" "RUNNING"
        fi

        # Check Agent State Monitor
        if ! is_process_running "$AGENT_STATE_MONITOR_SCRIPT"; then
            local failures=$(increment_failure_count "$AGENT_STATE_MONITOR_SCRIPT")
            log_event "WARNING" "⚠️ Agent State Monitor NOT RUNNING (failure count: $failures)"

            if [ $failures -ge $MAX_CONSECUTIVE_FAILURES ]; then
                restart_agent_monitor
                if [ $? -eq 0 ]; then
                    reset_failure_count "$AGENT_STATE_MONITOR_SCRIPT"
                    update_state "agent_monitor" "RESTARTED"
                else
                    update_state "agent_monitor" "FAILED"
                fi
            fi
        else
            reset_failure_count "$AGENT_STATE_MONITOR_SCRIPT"
            update_state "agent_monitor" "RUNNING"
        fi

        # Check Health Monitor
        if ! is_process_running "$HEALTH_MONITOR_SCRIPT"; then
            local failures=$(increment_failure_count "$HEALTH_MONITOR_SCRIPT")
            log_event "WARNING" "⚠️ Health Monitor NOT RUNNING (failure count: $failures)"

            if [ $failures -ge $MAX_CONSECUTIVE_FAILURES ]; then
                restart_health_monitor
                if [ $? -eq 0 ]; then
                    reset_failure_count "$HEALTH_MONITOR_SCRIPT"
                    update_state "health_monitor" "RESTARTED"
                else
                    update_state "health_monitor" "FAILED"
                fi
            fi
        else
            reset_failure_count "$HEALTH_MONITOR_SCRIPT"
            update_state "health_monitor" "RUNNING"
        fi

        # Log health check summary
        log_event "INFO" "✅ Failsafe check complete - All critical systems monitored"

        # Wait before next check
        sleep "$CHECK_INTERVAL"
    done
}

# Handle signals
trap 'log_event "INFO" "🛑 Ultimate Failsafe shutting down"; exit 0' SIGINT SIGTERM

# Start failsafe
main
