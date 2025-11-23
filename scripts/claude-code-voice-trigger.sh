#!/bin/bash
# ==================================================
# Claude Code Voice Trigger
# Claude Codeが入力待ちのときSuperWhisperを自動起動
# ==================================================

LOG_FILE="$HOME/.claude_voice_trigger.log"
CHECK_INTERVAL="${CLAUDE_VOICE_INTERVAL:-2}"  # 秒

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

# SuperWhisperの録音を開始
start_recording() {
    # URLスキームで録音開始
    open "superwhisper://record" 2>/dev/null

    # 通知音
    afplay /System/Library/Sounds/Ping.aiff 2>/dev/null &

    log "[VOICE] Recording started"
}

# SuperWhisperの録音を停止
stop_recording() {
    osascript -e '
        tell application "System Events"
            key code 49 using control down
        end tell
    '
    log "[VOICE] Recording stopped"
}

# Claude Codeが入力待ちかチェック
is_claude_waiting_for_input() {
    # iTerm/Terminalがフォーカスされているか確認
    local focused_app=$(osascript -e '
        tell application "System Events"
            name of first application process whose frontmost is true
        end tell
    ')

    if [[ "$focused_app" != "iTerm2" && "$focused_app" != "Terminal" ]]; then
        return 1
    fi

    # ターミナルの最後の数行を取得してプロンプトを確認
    local terminal_text
    if [[ "$focused_app" == "iTerm2" ]]; then
        terminal_text=$(osascript -e '
            tell application "iTerm2"
                tell current session of current window
                    set theContent to contents
                    return theContent
                end tell
            end tell
        ' 2>/dev/null)
    fi

    # 最後の数行を取得
    local last_lines=$(echo "$terminal_text" | tail -5)

    # Claude Codeの入力待ちパターンをチェック
    # パターン1: ">" プロンプトのみの行
    if echo "$last_lines" | grep -qE '^[[:space:]]*>[[:space:]]*$'; then
        return 0
    fi

    # パターン2: 入力行に何も入力されていない状態
    if echo "$last_lines" | grep -qE '────.*────$'; then
        # 区切り線の後にプロンプトがある
        if echo "$last_lines" | tail -2 | grep -qE '^>'; then
            return 0
        fi
    fi

    return 1
}

# メインループ
main() {
    log "Claude Code Voice Trigger started"
    log "Check interval: ${CHECK_INTERVAL}s"

    local was_waiting=false
    local is_recording=false

    while true; do
        if is_claude_waiting_for_input; then
            if [[ "$was_waiting" == false ]]; then
                log "[DETECT] Claude Code is waiting for input"
                was_waiting=true

                # 少し待ってから録音開始 (誤検知防止)
                sleep 0.5

                if is_claude_waiting_for_input && [[ "$is_recording" == false ]]; then
                    start_recording
                    is_recording=true
                fi
            fi
        else
            if [[ "$was_waiting" == true ]]; then
                log "[DETECT] Claude Code is no longer waiting"
                was_waiting=false

                # 録音が続いていれば停止は不要 (ユーザーが話し終わると自動停止)
                is_recording=false
            fi
        fi

        sleep "$CHECK_INTERVAL"
    done
}

# シグナルハンドリング
trap 'log "Shutting down..."; exit 0' SIGINT SIGTERM

main "$@"
