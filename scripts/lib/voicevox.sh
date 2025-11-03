#!/bin/bash
# Miyabi Orchestra - VOICEVOX Integration Library
# Purpose: Centralized VOICEVOX speaker mapping and notification

set -euo pipefail

WORKING_DIR="${WORKING_DIR:-/Users/shunsuke/Dev/miyabi-private}"
VOICEVOX_ENQUEUE="${VOICEVOX_ENQUEUE:-$WORKING_DIR/tools/voicevox_enqueue.sh}"

# Agent名からVOICEVOX Speaker IDを取得
# Usage: get_agent_speaker_id "カエデ"
# Returns: speaker ID number (e.g., "2")
get_agent_speaker_id() {
    case "$1" in
        "カンナ") echo "3" ;;    # ずんだもん（ノーマル）
        "カエデ") echo "2" ;;    # 四国めたん（ノーマル）
        "サクラ") echo "8" ;;    # 春日部つむぎ（ノーマル）
        "ツバキ") echo "10" ;;   # 雨晴はう（ノーマル）
        "ボタン") echo "14" ;;   # 冥鳴ひまり（ノーマル）
        "クモ") echo "1" ;;      # ずんだもん（あまあま）
        "Codex-1") echo "11" ;;  # 波音リツ（ノーマル）
        "Codex-2") echo "12" ;;  # 玄野武宏（ノーマル）
        "Codex-3") echo "13" ;;  # 白上虎太郎（ノーマル）
        "Codex-4") echo "16" ;;  # 青山龍星（ノーマル）
        *) echo "3" ;;           # デフォルト: ずんだもん
    esac
}

# VOICEVOX音声通知送信
# Usage: send_voicevox_notification "カエデ" "メッセージ" [speed]
# speed: 0.5-2.0 (default: 1.0)
send_voicevox_notification() {
    local agent_name="$1"
    local message="$2"
    local speed="${3:-1.0}"

    local speaker_id=$(get_agent_speaker_id "$agent_name")

    if [ -x "$VOICEVOX_ENQUEUE" ]; then
        "$VOICEVOX_ENQUEUE" "$message" "$speaker_id" "$speed" 2>/dev/null || true
    fi
}

# VOICEVOX通知（複数エージェント対応）
# Usage: send_voicevox_multi "カエデ,サクラ" "共通メッセージ" [speed]
send_voicevox_multi() {
    local agent_names="$1"
    local message="$2"
    local speed="${3:-1.0}"

    IFS=',' read -ra agents <<< "$agent_names"

    for agent in "${agents[@]}"; do
        send_voicevox_notification "$agent" "$message" "$speed"
        sleep 0.5  # Avoid queue flooding
    done
}

# タスク開始通知（定型メッセージ）
# Usage: voicevox_task_started "カエデ" "270"
voicevox_task_started() {
    local agent_name="$1"
    local issue_number="$2"

    local message="${agent_name}、Issue ${issue_number}、開始。"
    send_voicevox_notification "カンナ" "$message" 1.1
}

# タスク完了通知（定型メッセージ）
# Usage: voicevox_task_completed "カエデ" "270"
voicevox_task_completed() {
    local agent_name="$1"
    local issue_number="$2"

    local message="Issue ${issue_number}、完了。"
    send_voicevox_notification "$agent_name" "$message" 1.1
}

# エラー通知（定型メッセージ）
# Usage: voicevox_error "カエデ" "メモリ不足"
voicevox_error() {
    local agent_name="$1"
    local error_type="$2"

    local message="${agent_name}、エラー。${error_type}。"
    send_voicevox_notification "カンナ" "$message" 0.9
}

# 警告通知（定型メッセージ）
# Usage: voicevox_warning "SLA違反"
voicevox_warning() {
    local warning_message="$1"

    local message="警告。${warning_message}。"
    send_voicevox_notification "カンナ" "$message" 1.0
}

# システム通知（定型メッセージ）
# Usage: voicevox_system "Water Spider起動"
voicevox_system() {
    local system_message="$1"

    send_voicevox_notification "クモ" "$system_message" 1.0
}

# VOICEVOX利用可能チェック
# Usage: is_voicevox_available
# Returns: 0 if available, 1 if not
is_voicevox_available() {
    if [ -x "$VOICEVOX_ENQUEUE" ]; then
        return 0
    else
        return 1
    fi
}

# Export functions
export -f get_agent_speaker_id
export -f send_voicevox_notification
export -f send_voicevox_multi
export -f voicevox_task_started
export -f voicevox_task_completed
export -f voicevox_error
export -f voicevox_warning
export -f voicevox_system
export -f is_voicevox_available
