#!/bin/bash
#
# VOICEVOX Task Completion Notification Hook
#
# このフックは作業完了時に呼び出され、
# ズンダモンの音声 + macOS通知でユーザーに報告します。
#
# Trigger: Notification (task completion, errors, user attention needed)
# Output: VOICEVOX queue + macOS notification
#

set -euo pipefail

# ==============================
# Configuration
# ==============================

VOICEVOX_ENQUEUE="${VOICEVOX_ENQUEUE:-tools/voicevox_enqueue.sh}"
SPEAKER_ID="${VOICEVOX_SPEAKER:-3}"  # 3 = ずんだもん
SPEED="${VOICEVOX_SPEED:-1.0}"  # Slower for important notifications
QUEUE_DIR="/tmp/voicevox_queue"

# ==============================
# Hook Event Data
# ==============================

# Claude Code provides these environment variables:
# - NOTIFICATION_TYPE: Type of notification (e.g., "task_complete", "error", "user_input_needed")
# - NOTIFICATION_MESSAGE: Notification message
# - NOTIFICATION_TITLE: Notification title

NOTIFICATION_TYPE="${NOTIFICATION_TYPE:-general}"
MESSAGE="${NOTIFICATION_MESSAGE:-作業が完了しました}"
TITLE="${NOTIFICATION_TITLE:-Claude Code}"

# ==============================
# Narration Text Generation
# ==============================

generate_notification_narration() {
    local type="$1"
    local message="$2"

    case "$type" in
        task_complete)
            echo "作業が完了したのだ！${message}なのだ！ユーザーの確認が必要なのだ！"
            ;;
        error)
            echo "エラーが発生したのだ！${message}なのだ！対応が必要なのだ！"
            ;;
        user_input_needed)
            echo "ユーザーの入力が必要なのだ！${message}を確認してほしいのだ！"
            ;;
        agent_waiting)
            echo "エージェントが待機中なのだ！${message}を確認してほしいのだ！"
            ;;
        *)
            echo "通知なのだ！${message}なのだ！"
            ;;
    esac
}

# ==============================
# macOS Notification
# ==============================

send_macos_notification() {
    local title="$1"
    local message="$2"
    local type="$3"

    # Choose sound based on notification type
    case "$type" in
        error)
            local sound="Basso"
            ;;
        task_complete)
            local sound="Glass"
            ;;
        user_input_needed)
            local sound="Tink"
            ;;
        *)
            local sound="default"
            ;;
    esac

    # Send macOS notification
    osascript -e "display notification \"$message\" with title \"$title\" sound name \"$sound\""
}

# ==============================
# Enqueue to VOICEVOX
# ==============================

enqueue_narration() {
    local text="$1"

    # Check if enqueue script exists
    if [ ! -f "$VOICEVOX_ENQUEUE" ]; then
        # Silently skip if VOICEVOX is not available
        return 0
    fi

    # Enqueue narration (non-blocking)
    "$VOICEVOX_ENQUEUE" "$text" "$SPEAKER_ID" "$SPEED" > /dev/null 2>&1 &
}

# ==============================
# Main
# ==============================

main() {
    # Generate narration text
    NARRATION=$(generate_notification_narration "$NOTIFICATION_TYPE" "$MESSAGE")

    # Send macOS notification
    send_macos_notification "$TITLE" "$MESSAGE" "$NOTIFICATION_TYPE"

    # Enqueue to VOICEVOX (background, non-blocking)
    enqueue_narration "$NARRATION"

    # Log to hook log
    if [ -d "$QUEUE_DIR" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [Notification:$NOTIFICATION_TYPE] $NARRATION" >> "$QUEUE_DIR/hook.log"
    fi
}

# Run only if VOICEVOX narration is enabled
if [ "${VOICEVOX_NARRATION_ENABLED:-true}" = "true" ]; then
    main
fi

exit 0
