#!/bin/bash
# ==================================================
# SuperWhisper Post-Process Script
# SuperWhisperのscript機能で実行される
# 文字起こし結果を受け取り、コマンド実行またはClaudeへ送信
# ==================================================

# 入力: SuperWhisperから文字起こし結果が$1で渡される
INPUT_TEXT="$1"
LOG_FILE="$HOME/.superwhisper_postprocess.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

log "Received: $INPUT_TEXT"

# コマンドパターン検出
case "$INPUT_TEXT" in
    *"コミットして"*|*"commit"*)
        log "[CMD] Git Commit"
        cd ~/Dev/01-miyabi/_core/miyabi-private
        git add -A && git commit -m "voice: $INPUT_TEXT"
        # 結果を出力（SuperWhisperに返す）
        echo "コミット完了"
        ;;
    *"プッシュして"*|*"push"*)
        log "[CMD] Git Push"
        cd ~/Dev/01-miyabi/_core/miyabi-private
        git push origin HEAD 2>&1 | tail -1
        ;;
    *"ビルドして"*|*"build"*)
        log "[CMD] Cargo Build"
        cd ~/Dev/01-miyabi/_core/miyabi-private
        cargo build 2>&1 | tail -5
        ;;
    *"テストして"*|*"test"*)
        log "[CMD] Cargo Test"
        cd ~/Dev/01-miyabi/_core/miyabi-private
        cargo test 2>&1 | tail -10
        ;;
    *"ステータス"*|*"status"*)
        log "[CMD] Git Status"
        cd ~/Dev/01-miyabi/_core/miyabi-private
        git status -s
        ;;
    *)
        # コマンドでない場合はそのまま出力
        echo "$INPUT_TEXT"
        ;;
esac
