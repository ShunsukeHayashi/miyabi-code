#!/bin/bash
#
# VOICEVOX Real-time Narration Hook
#
# このフックは全てのツール実行時に呼び出され、
# ズンダモンの音声で操作内容を詳しく解説します。
#
# Trigger: tool-use (Read, Write, Edit, Bash, etc.)
# Output: VOICEVOX queue (non-blocking)
#

set -euo pipefail

# ==============================
# Configuration
# ==============================

VOICEVOX_ENQUEUE="${VOICEVOX_ENQUEUE:-tools/voicevox_enqueue.sh}"
SPEAKER_ID="${VOICEVOX_SPEAKER:-3}"  # 3 = ずんだもん
SPEED="${VOICEVOX_SPEED:-1.2}"
QUEUE_DIR="/tmp/voicevox_queue"

# ==============================
# Hook Event Data
# ==============================

# Claude Code provides these environment variables:
# - TOOL_NAME: Name of the tool being used (e.g., "Read", "Write", "Bash")
# - TOOL_INPUT: JSON string of tool input parameters
# - TOOL_DESCRIPTION: User-provided description (if any)

TOOL="${TOOL_NAME:-unknown}"
INPUT="${TOOL_INPUT:-{}}"
DESC="${TOOL_DESCRIPTION:-}"

# ==============================
# Narration Text Generation
# ==============================

generate_narration() {
    local tool="$1"
    local input="$2"
    local desc="$3"

    case "$tool" in
        Read)
            local file_path=$(echo "$input" | jq -r '.file_path // empty')
            if [ -n "$file_path" ]; then
                local filename=$(basename "$file_path")
                echo "ファイル「${filename}」を読み込み中なのだ！内容を確認するのだ！"
            else
                echo "ファイルを読み込み中なのだ！"
            fi
            ;;

        Write)
            local file_path=$(echo "$input" | jq -r '.file_path // empty')
            if [ -n "$file_path" ]; then
                local filename=$(basename "$file_path")
                echo "ファイル「${filename}」を新規作成するのだ！書き込み開始なのだ！"
            else
                echo "新しいファイルを作成するのだ！"
            fi
            ;;

        Edit)
            local file_path=$(echo "$input" | jq -r '.file_path // empty')
            if [ -n "$file_path" ]; then
                local filename=$(basename "$file_path")
                echo "ファイル「${filename}」を編集するのだ！変更を適用するのだ！"
            else
                echo "ファイルを編集するのだ！"
            fi
            ;;

        Bash)
            if [ -n "$desc" ]; then
                echo "コマンド実行なのだ！${desc}を実行するのだ！"
            else
                echo "シェルコマンドを実行するのだ！処理中なのだ！"
            fi
            ;;

        Glob)
            local pattern=$(echo "$input" | jq -r '.pattern // empty')
            if [ -n "$pattern" ]; then
                echo "パターン「${pattern}」でファイル検索中なのだ！"
            else
                echo "ファイル検索を実行するのだ！"
            fi
            ;;

        Grep)
            local pattern=$(echo "$input" | jq -r '.pattern // empty')
            if [ -n "$pattern" ]; then
                echo "「${pattern}」を検索中なのだ！マッチするコードを探すのだ！"
            else
                echo "コード検索を実行するのだ！"
            fi
            ;;

        TodoWrite)
            echo "TODOリストを更新するのだ！タスク管理を最新化するのだ！"
            ;;

        Task)
            local desc_field=$(echo "$input" | jq -r '.description // empty')
            if [ -n "$desc_field" ]; then
                echo "サブエージェント起動なのだ！${desc_field}を実行するのだ！"
            else
                echo "エージェントタスクを起動するのだ！"
            fi
            ;;

        WebFetch)
            local url=$(echo "$input" | jq -r '.url // empty')
            if [ -n "$url" ]; then
                echo "ウェブページを取得中なのだ！${url}からデータを読み込むのだ！"
            else
                echo "ウェブコンテンツを取得するのだ！"
            fi
            ;;

        *)
            if [ -n "$desc" ]; then
                echo "${desc}を実行中なのだ！"
            else
                echo "ツール「${tool}」を実行中なのだ！"
            fi
            ;;
    esac
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
    NARRATION=$(generate_narration "$TOOL" "$INPUT" "$DESC")

    # Enqueue to VOICEVOX (background, non-blocking)
    enqueue_narration "$NARRATION"

    # Log to hook log (optional)
    if [ -d "$QUEUE_DIR" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$TOOL] $NARRATION" >> "$QUEUE_DIR/hook.log"
    fi
}

# Run only if VOICEVOX narration is enabled
if [ "${VOICEVOX_NARRATION_ENABLED:-true}" = "true" ]; then
    main
fi

exit 0
