#!/bin/bash
# Session Watchdog - Alerts when Claude Code session is inactive

TIMEOUT_SECONDS=30  # Alert after 30 seconds of inactivity
CHECK_INTERVAL=5     # Check every 5 seconds
ALERT_INTERVAL=10    # Repeat alert every 10 seconds
ACTIVITY_FILE="/tmp/claude_last_activity"
VOICEVOX_SCRIPT="tools/voicevox_enqueue.sh"

# Initialize activity file
touch "$ACTIVITY_FILE"

echo "🐕 Session Watchdog started"
echo "   Timeout: ${TIMEOUT_SECONDS}s"
echo "   Check interval: ${CHECK_INTERVAL}s"
echo "   Alert interval: ${ALERT_INTERVAL}s"
echo ""

last_alert_time=0

while true; do
    current_time=$(date +%s)
    last_activity=$(stat -f %m "$ACTIVITY_FILE" 2>/dev/null || echo 0)

    # Calculate time since last activity
    time_diff=$((current_time - last_activity))

    if [ $time_diff -gt $TIMEOUT_SECONDS ]; then
        # Session is inactive
        time_since_alert=$((current_time - last_alert_time))

        if [ $time_since_alert -ge $ALERT_INTERVAL ]; then
            # Send alert
            inactive_minutes=$((time_diff / 60))
            inactive_seconds=$((time_diff % 60))

            if [ -f "$VOICEVOX_SCRIPT" ]; then
                "$VOICEVOX_SCRIPT" "警告！セッションが${inactive_minutes}分${inactive_seconds}秒止まっているよ！応答がないのだ！" 3 1.3
            fi

            # macOS notification
            osascript -e "display notification \"セッションが${inactive_minutes}分${inactive_seconds}秒停止中\" with title \"⚠️ Claude Code Watchdog\" sound name \"Basso\""

            echo "⚠️  [$(date '+%H:%M:%S')] Alert: Session inactive for ${inactive_minutes}m ${inactive_seconds}s"

            last_alert_time=$current_time
        fi
    else
        # Session is active
        if [ $last_alert_time -ne 0 ]; then
            # Recovery from inactive state
            if [ -f "$VOICEVOX_SCRIPT" ]; then
                "$VOICEVOX_SCRIPT" "セッション復帰！また元気に動き出したよ！" 3 1.0
            fi

            osascript -e "display notification \"セッションが復帰しました\" with title \"✅ Claude Code Watchdog\" sound name \"Glass\""

            echo "✅ [$(date '+%H:%M:%S')] Session recovered"
            last_alert_time=0
        fi
    fi

    sleep $CHECK_INTERVAL
done
