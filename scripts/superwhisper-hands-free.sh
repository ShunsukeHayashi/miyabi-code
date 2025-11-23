#!/bin/bash
# ==================================================
# SuperWhisper ハンズフリー自動化システム
# 録音フォルダを監視し、音声コマンドを自動実行
# ==================================================

set -euo pipefail

RECORDINGS_DIR="$HOME/Documents/superwhisper/recordings"
PROCESSED_FILE="$HOME/.superwhisper_processed"
LOG_FILE="$HOME/.superwhisper_handsfree.log"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
    echo -e "$1"
}

# 処理済みファイルの初期化
touch "$PROCESSED_FILE"

# 音声コマンドのパターンマッチング
process_transcription() {
    local text="$1"
    local recording_id="$2"

    # コマンドパターン検出
    case "$text" in
        *"コミットして"*|*"commit"*)
            log "${GREEN}[COMMAND] Git Commit 実行${NC}"
            cd ~/Dev/01-miyabi/_core/miyabi-private
            git add -A && git commit -m "feat: voice commit - $text"
            ;;
        *"プッシュして"*|*"push"*)
            log "${GREEN}[COMMAND] Git Push 実行${NC}"
            cd ~/Dev/01-miyabi/_core/miyabi-private
            git push origin HEAD
            ;;
        *"ビルドして"*|*"build"*)
            log "${GREEN}[COMMAND] Cargo Build 実行${NC}"
            cd ~/Dev/01-miyabi/_core/miyabi-private
            cargo build
            ;;
        *"テストして"*|*"test"*)
            log "${GREEN}[COMMAND] Cargo Test 実行${NC}"
            cd ~/Dev/01-miyabi/_core/miyabi-private
            cargo test
            ;;
        *"ステータス"*|*"status"*)
            log "${GREEN}[COMMAND] Git Status 表示${NC}"
            cd ~/Dev/01-miyabi/_core/miyabi-private
            git status
            ;;
        *"イシュー作成"*|*"create issue"*)
            log "${GREEN}[COMMAND] Issue 作成${NC}"
            # タイトルを抽出 (「イシュー作成」の後の文章)
            local title=$(echo "$text" | sed 's/.*イシュー作成[[:space:]]*//' | sed 's/.*create issue[[:space:]]*//')
            if [ -n "$title" ]; then
                cd ~/Dev/01-miyabi/_core/miyabi-private
                gh issue create --title "$title" --body "Voice created issue"
            fi
            ;;
        *"ヘルプ"*|*"help"*)
            log "${BLUE}[HELP] 利用可能な音声コマンド:${NC}"
            echo "  - コミットして / commit"
            echo "  - プッシュして / push"
            echo "  - ビルドして / build"
            echo "  - テストして / test"
            echo "  - ステータス / status"
            echo "  - イシュー作成 [タイトル]"
            echo "  - クロード [メッセージ]"
            ;;
        *"クロード"*|*"claude"*)
            # Claude Codeへ直接送信
            local message=$(echo "$text" | sed 's/.*クロード[[:space:]]*//' | sed 's/.*claude[[:space:]]*//')
            if [ -n "$message" ]; then
                log "${GREEN}[COMMAND] Claude Code へ送信: $message${NC}"
                # pbcopyでクリップボードに入れて貼り付け
                echo "$message" | pbcopy
                # AppleScriptでiTermにペースト
                osascript -e 'tell application "iTerm" to tell current session of current window to write text (the clipboard)'
            fi
            ;;
        *)
            # 通常の文字起こし - クリップボードにコピー
            log "${YELLOW}[TEXT] 文字起こし完了: ${text:0:50}...${NC}"
            echo "$text" | pbcopy
            ;;
    esac
}

# 新しい録音を処理
process_new_recordings() {
    local recordings=$(find "$RECORDINGS_DIR" -maxdepth 1 -type d -name "[0-9]*" | sort -n)

    for recording_dir in $recordings; do
        local recording_id=$(basename "$recording_dir")
        local meta_file="$recording_dir/meta.json"

        # 処理済みチェック
        if grep -q "^$recording_id$" "$PROCESSED_FILE" 2>/dev/null; then
            continue
        fi

        # meta.json が存在するか確認
        if [ ! -f "$meta_file" ]; then
            continue
        fi

        # 文字起こし結果を取得
        local result=$(python3 -c "import json; print(json.load(open('$meta_file'))['result'])" 2>/dev/null)

        if [ -n "$result" ]; then
            log "${BLUE}[NEW] Recording $recording_id: $result${NC}"
            process_transcription "$result" "$recording_id"
            echo "$recording_id" >> "$PROCESSED_FILE"
        fi
    done
}

# 監視モード
watch_mode() {
    log "${GREEN}SuperWhisper ハンズフリーモード開始${NC}"
    log "録音フォルダ: $RECORDINGS_DIR"
    log "「ヘルプ」と言うとコマンド一覧を表示"

    while true; do
        process_new_recordings
        sleep 2
    done
}

# ワンショットモード
oneshot_mode() {
    process_new_recordings
}

# VOICEVOXフィードバック
voicevox_feedback() {
    local text="$1"
    local host="${VOICEVOX_HOST:-localhost}"
    local port="${VOICEVOX_PORT:-50021}"
    local speaker="${VOICEVOX_SPEAKER:-1}"

    # VOICEVOX が利用可能か確認
    if curl -s "http://$host:$port/version" > /dev/null 2>&1; then
        # 音声合成クエリ
        local query=$(curl -s -X POST \
            "http://$host:$port/audio_query?text=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$text'))")&speaker=$speaker")

        # 音声合成実行
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$query" \
            "http://$host:$port/synthesis?speaker=$speaker" \
            --output /tmp/voicevox_feedback.wav

        # 再生
        afplay /tmp/voicevox_feedback.wav 2>/dev/null &
    fi
}

# メイン
case "${1:-watch}" in
    watch)
        watch_mode
        ;;
    once)
        oneshot_mode
        ;;
    process)
        if [ -n "${2:-}" ]; then
            process_transcription "$2" "manual"
        fi
        ;;
    *)
        echo "Usage: $0 {watch|once|process <text>}"
        exit 1
        ;;
esac
