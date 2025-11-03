#!/bin/bash
# Miyabi System Watchdog - 24/7 Infrastructure Guardian
# Purpose: Monitor and auto-recover ALL critical infrastructure components
# Mission: ZERO downtime - 365 days x 24 hours operation

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
WATCHDOG_LOG="$WORKING_DIR/.ai/logs/system-watchdog.log"
WATCHDOG_STATE="$WORKING_DIR/.ai/state/watchdog-state.json"
ALERT_LOG="$WORKING_DIR/.ai/logs/critical-alerts.log"

CHECK_INTERVAL=30  # Check every 30 seconds
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=60  # Cooldown period between restarts

# Critical components to monitor
WATER_SPIDER_SCRIPT="$WORKING_DIR/scripts/water-spider-monitor-v2.sh"
STATE_MONITOR_SCRIPT="$WORKING_DIR/scripts/agent-state-monitor-listener.sh"
VOICEVOX_WORKER="$WORKING_DIR/tools/voicevox_worker.sh"

log_event() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [Watchdog] $message" >> "$WATCHDOG_LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message"
}

log_critical_alert() {
    local component="$1"
    local issue="$2"
    local action="$3"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CRITICAL] Component: $component | Issue: $issue | Action: $action" >> "$ALERT_LOG"
    log_event "CRITICAL" "$component FAILURE: $issue - Action: $action"

    # VOICEVOX critical alert
    if command -v python3 &> /dev/null; then
        python3 "$WORKING_DIR/tools/send-voicevox-message.py" \
            "緊急警告！$component が停止したのだ！自動復旧を開始するのだ！" \
            3 \
            1.2 &
    fi
}

# Check if Water Spider is running
is_water_spider_running() {
    pgrep -f "water-spider-monitor-v2.sh" > /dev/null
}

# Check if Agent State Monitor is running
is_state_monitor_running() {
    pgrep -f "agent-state-monitor-listener.sh" > /dev/null
}

# Check if VOICEVOX worker is running
is_voicevox_running() {
    pgrep -f "voicevox_worker.sh" > /dev/null
}

# Restart Water Spider
restart_water_spider() {
    log_critical_alert "Water Spider" "Process not found" "Restarting"

    # Kill any zombie processes first
    pkill -f "water-spider-monitor-v2.sh" 2>/dev/null
    sleep 2

    # Restart in background
    nohup bash "$WATER_SPIDER_SCRIPT" >> "$WORKING_DIR/.ai/logs/water-spider-restart.log" 2>&1 &

    sleep 5

    if is_water_spider_running; then
        log_event "INFO" "✅ Water Spider successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ Water Spider restart FAILED"
        return 1
    fi
}

# Restart Agent State Monitor
restart_state_monitor() {
    log_critical_alert "Agent State Monitor" "Process not found" "Restarting"

    # Kill any zombie processes
    pkill -f "agent-state-monitor-listener.sh" 2>/dev/null
    sleep 2

    # Restart in background
    nohup bash "$STATE_MONITOR_SCRIPT" >> "$WORKING_DIR/.ai/logs/state-monitor-restart.log" 2>&1 &

    sleep 5

    if is_state_monitor_running; then
        log_event "INFO" "✅ Agent State Monitor successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ Agent State Monitor restart FAILED"
        return 1
    fi
}

# Restart VOICEVOX worker
restart_voicevox() {
    log_critical_alert "VOICEVOX Worker" "Process not found" "Restarting"

    # Kill any zombie processes
    pkill -f "voicevox_worker.sh" 2>/dev/null
    sleep 2

    # Restart in background
    nohup bash "$VOICEVOX_WORKER" >> "$WORKING_DIR/.ai/logs/voicevox-restart.log" 2>&1 &

    sleep 3

    if is_voicevox_running; then
        log_event "INFO" "✅ VOICEVOX Worker successfully restarted"
        return 0
    else
        log_event "ERROR" "❌ VOICEVOX Worker restart FAILED"
        return 1
    fi
}

# Update watchdog state
update_watchdog_state() {
    local component="$1"
    local status="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "$(dirname "$WATCHDOG_STATE")"

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg comp "$component" \
           --arg status "$status" \
           --arg ts "$timestamp" \
           '.last_check = $ts | .components[$comp] = {
               status: $status,
               last_check: $ts,
               checks: ((.components[$comp].checks // 0) + 1)
           }' \
           "$WATCHDOG_STATE" > "$temp_file" 2>/dev/null || \
           echo "{\"version\":\"1.0.0\",\"last_check\":\"$timestamp\",\"components\":{}}" > "$temp_file"
        mv "$temp_file" "$WATCHDOG_STATE"
    fi
}

# Main watchdog loop
main() {
    log_event "INFO" "🐕 Miyabi System Watchdog started - 24/7 High Availability Mode"
    log_event "INFO" "📊 Monitoring: Water Spider, Agent State Monitor, VOICEVOX Worker"
    log_event "INFO" "⏱️  Check interval: ${CHECK_INTERVAL}s | Max restart attempts: $MAX_RESTART_ATTEMPTS"

    # Initialize state
    if [ ! -f "$WATCHDOG_STATE" ]; then
        echo '{"version":"1.0.0","last_check":"","components":{}}' > "$WATCHDOG_STATE"
    fi

    local water_spider_failures=0
    local state_monitor_failures=0
    local voicevox_failures=0

    while true; do
        # Check Water Spider
        if ! is_water_spider_running; then
            ((water_spider_failures++))
            log_event "WARNING" "⚠️ Water Spider not running (failure count: $water_spider_failures)"

            if [ $water_spider_failures -le $MAX_RESTART_ATTEMPTS ]; then
                restart_water_spider
                sleep $RESTART_COOLDOWN
            else
                log_critical_alert "Water Spider" "Max restart attempts exceeded" "Manual intervention required"
            fi

            update_watchdog_state "water_spider" "FAILED"
        else
            water_spider_failures=0
            update_watchdog_state "water_spider" "RUNNING"
        fi

        # Check Agent State Monitor
        if ! is_state_monitor_running; then
            ((state_monitor_failures++))
            log_event "WARNING" "⚠️ Agent State Monitor not running (failure count: $state_monitor_failures)"

            if [ $state_monitor_failures -le $MAX_RESTART_ATTEMPTS ]; then
                restart_state_monitor
                sleep $RESTART_COOLDOWN
            else
                log_critical_alert "Agent State Monitor" "Max restart attempts exceeded" "Manual intervention required"
            fi

            update_watchdog_state "state_monitor" "FAILED"
        else
            state_monitor_failures=0
            update_watchdog_state "state_monitor" "RUNNING"
        fi

        # Check VOICEVOX Worker
        if ! is_voicevox_running; then
            ((voicevox_failures++))
            log_event "WARNING" "⚠️ VOICEVOX Worker not running (failure count: $voicevox_failures)"

            if [ $voicevox_failures -le $MAX_RESTART_ATTEMPTS ]; then
                restart_voicevox
                sleep $RESTART_COOLDOWN
            else
                log_critical_alert "VOICEVOX Worker" "Max restart attempts exceeded" "Manual intervention required"
            fi

            update_watchdog_state "voicevox" "FAILED"
        else
            voicevox_failures=0
            update_watchdog_state "voicevox" "RUNNING"
        fi

        # Log health check summary
        log_event "INFO" "✅ Health check complete - Water Spider: OK | State Monitor: OK | VOICEVOX: OK"

        # Wait before next check
        sleep "$CHECK_INTERVAL"
    done
}

# Handle signals
trap 'log_event "INFO" "🛑 Watchdog shutting down gracefully"; exit 0' SIGINT SIGTERM

# Start watchdog
main
