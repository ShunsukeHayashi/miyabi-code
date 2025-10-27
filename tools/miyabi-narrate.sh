#!/bin/bash
#
# Miyabi開発進捗 → ゆっくり解説音声ガイド 統合スクリプト
#
# Usage:
#   ./miyabi-narrate.sh [options]
#
# Options:
#   -d, --days N          過去N日分のcommitsを収集（デフォルト: 3）
#   -o, --output DIR      出力ディレクトリ（デフォルト: ./output）
#   -s, --start-engine    VOICEVOX Engineを自動起動
#   -k, --keep-engine     実行後もEngineを起動したまま
#   -v, --video           動画ファイル（MP4）も生成
#   -t, --thumbnail       サムネイル画像も生成（BytePlus ARK API使用）
#   -l, --stream          Social Stream Ninjaに送信（ライブストリーミング）
#   -h, --help            ヘルプ表示
#

set -e  # エラー時に即終了

# デフォルト設定
DAYS=3
OUTPUT_DIR="./output"
START_ENGINE=false
KEEP_ENGINE=false
GENERATE_VIDEO=false
GENERATE_THUMBNAIL=false
STREAM_MODE=false
VOICEVOX_ENGINE_DIR="/Users/a003/dev/voicevox_engine"
VOICEVOX_PORT=50021

# 色付きログ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプ表示
show_help() {
    cat << EOF
Miyabi開発進捗 → ゆっくり解説音声ガイド 統合スクリプト

Usage:
    ./miyabi-narrate.sh [options]

Options:
    -d, --days N          過去N日分のcommitsを収集（デフォルト: 3）
    -o, --output DIR      出力ディレクトリ（デフォルト: ./output）
    -s, --start-engine    VOICEVOX Engineを自動起動
    -k, --keep-engine     実行後もEngineを起動したまま
    -v, --video           動画ファイル（MP4）も生成
    -t, --thumbnail       サムネイル画像も生成（BytePlus ARK API使用）
    -l, --stream          Social Stream Ninjaに送信（ライブストリーミング）
    -h, --help            ヘルプ表示

Examples:
    # 基本的な使用
    ./miyabi-narrate.sh

    # 7日分の進捗を生成、Engineも自動起動
    ./miyabi-narrate.sh -d 7 -s

    # 動画ファイル（MP4）も生成
    ./miyabi-narrate.sh -v

    # サムネイル画像も生成
    ./miyabi-narrate.sh -t

    # フル機能（Engine起動 + サムネイル + 動画生成）
    ./miyabi-narrate.sh -d 7 -s -t -v

    # ライブストリーミング（Social Stream Ninja）
    ./miyabi-narrate.sh -l

    # 完全版（全機能 + ライブストリーミング）
    ./miyabi-narrate.sh -d 7 -s -t -v -l

    # カスタム出力先
    ./miyabi-narrate.sh -o ~/Desktop/narration
EOF
}

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--days)
            DAYS="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -s|--start-engine)
            START_ENGINE=true
            shift
            ;;
        -k|--keep-engine)
            KEEP_ENGINE=true
            shift
            ;;
        -v|--video)
            GENERATE_VIDEO=true
            shift
            ;;
        -t|--thumbnail)
            GENERATE_THUMBNAIL=true
            shift
            ;;
        -l|--stream)
            STREAM_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# タイトル表示
echo ""
echo "============================================================"
echo "  🎤 Miyabi開発進捗 → ゆっくり解説音声ガイド"
echo "============================================================"
echo ""

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"
log_info "出力ディレクトリ: $OUTPUT_DIR"

# VOICEVOX Engine起動チェック
check_voicevox_engine() {
    if curl -s "http://127.0.0.1:$VOICEVOX_PORT/version" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

ENGINE_PID=""

# VOICEVOX Engine起動
if $START_ENGINE; then
    log_info "VOICEVOX Engineを起動しています..."

    if check_voicevox_engine; then
        log_warn "VOICEVOX Engineは既に起動しています"
    else
        cd "$VOICEVOX_ENGINE_DIR"
        export PATH="$HOME/.local/bin:$PATH"

        # バックグラウンドで起動
        uv run run.py --enable_mock --host 127.0.0.1 --port $VOICEVOX_PORT > /tmp/voicevox_engine.log 2>&1 &
        ENGINE_PID=$!

        # 起動待機
        log_info "Engineの起動を待機中..."
        for i in {1..30}; do
            if check_voicevox_engine; then
                log_success "VOICEVOX Engine起動完了（PID: $ENGINE_PID）"
                break
            fi
            sleep 1
        done

        if ! check_voicevox_engine; then
            log_error "VOICEVOX Engineの起動に失敗しました"

            # Lifecycle Hook: NarrationAgent Error (Claude Code Headless Mode)
            ERROR_HOOK="../.claude/hooks/narration-error-headless.sh"
            if [ -x "$ERROR_HOOK" ]; then
                "$ERROR_HOOK" voicevox "VOICEVOX Engine startup failed" &
            fi

            exit 1
        fi

        cd - > /dev/null
    fi
else
    # Engineが起動しているか確認
    if ! check_voicevox_engine; then
        log_error "VOICEVOX Engineが起動していません"
        log_info "以下のコマンドで起動してください："
        log_info "  cd $VOICEVOX_ENGINE_DIR"
        log_info "  uv run run.py --enable_mock"
        log_info ""
        log_info "または -s オプションで自動起動："
        log_info "  ./miyabi-narrate.sh -s"

        # Lifecycle Hook: NarrationAgent Error (Claude Code Headless Mode)
        ERROR_HOOK="../.claude/hooks/narration-error-headless.sh"
        if [ -x "$ERROR_HOOK" ]; then
            "$ERROR_HOOK" voicevox "VOICEVOX Engine not running" &
        fi

        exit 1
    fi
    log_success "VOICEVOX Engine接続確認OK"
fi

# Lifecycle Hook: NarrationAgent Start (Claude Code Headless Mode)
HOOK_SCRIPT="../.claude/hooks/narration-start-headless.sh"
if [ -x "$HOOK_SCRIPT" ]; then
    "$HOOK_SCRIPT" "$DAYS" &
fi

# Phase 1: 台本生成
echo ""
log_info "📝 Phase 1: 台本生成中..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/yukkuri-narration-generator.py" --days "$DAYS" || {
    log_error "台本生成に失敗しました"

    # Lifecycle Hook: NarrationAgent Error (Claude Code Headless Mode)
    ERROR_HOOK="../.claude/hooks/narration-error-headless.sh"
    if [ -x "$ERROR_HOOK" ]; then
        "$ERROR_HOOK" git "No commits found or script generation failed" &
    fi

    exit 1
}

# 生成ファイルを出力ディレクトリに移動
cp script.md "$OUTPUT_DIR/"
cp voicevox_requests.json "$OUTPUT_DIR/"
log_success "台本生成完了: $OUTPUT_DIR/script.md"

# Phase 2: 音声合成
echo ""
log_info "🎤 Phase 2: 音声合成中..."
python3 "$SCRIPT_DIR/voicevox-synthesizer.py" || {
    log_error "音声合成に失敗しました"
    exit 1
}

# 音声ファイルを出力ディレクトリに移動
if [ -d "audio" ]; then
    cp -r audio "$OUTPUT_DIR/"
    AUDIO_COUNT=$(ls audio/*.wav 2>/dev/null | wc -l)
    log_success "音声合成完了: $AUDIO_COUNT 件のファイルを生成"
fi

# Phase 2.5: サムネイル画像生成（オプション）
if $GENERATE_THUMBNAIL; then
    echo ""
    log_info "🎨 Phase 2.5: サムネイル画像生成中..."

    THUMBNAIL_OUTPUT="$OUTPUT_DIR/thumbnail.png"
    COMMIT_COUNT=$(git log --oneline --since="$DAYS days ago" 2>/dev/null | wc -l | xargs)

    python3 "$SCRIPT_DIR/thumbnail-generator.py" \
        --miyabi \
        --commits "$COMMIT_COUNT" \
        --audio "$AUDIO_COUNT" \
        --output "$THUMBNAIL_OUTPUT" || {
        log_error "サムネイル画像生成に失敗しました"
        log_warn "動画生成は続行します（デフォルトサムネイル使用）"
    }

    if [ -f "$THUMBNAIL_OUTPUT" ]; then
        log_success "サムネイル画像生成完了: $THUMBNAIL_OUTPUT"
    fi
fi

# Phase 3: 動画生成（オプション）
if $GENERATE_VIDEO; then
    echo ""
    log_info "🎬 Phase 3: 動画生成中..."

    VIDEO_OUTPUT="$OUTPUT_DIR/miyabi-progress.mp4"
    python3 "$SCRIPT_DIR/video-generator.py" --audio-dir "$OUTPUT_DIR/audio" --output "$VIDEO_OUTPUT" || {
        log_error "動画生成に失敗しました"
        exit 1
    }

    log_success "動画生成完了: $VIDEO_OUTPUT"
fi

# Phase 4: Social Stream Ninja統合（オプション）
if $STREAM_MODE; then
    echo ""
    log_info "📡 Phase 4: Social Stream Ninja統合中..."

    # セッション開始
    SESSION_ID="miyabi-narrate-$(date +%s)"
    python3 "$SCRIPT_DIR/social-stream-client.py" --start --session "$SESSION_ID" || {
        log_error "Social Stream Ninja接続失敗"
        log_warn "ストリーミングなしで続行します"
    }

    if [ $? -eq 0 ]; then
        # 台本からメッセージを送信
        log_info "台本をSocial Stream Ninjaに送信中..."

        while IFS= read -r line; do
            # 霊夢・魔理沙の台詞を送信
            if [[ $line =~ ^(霊夢|魔理沙): ]]; then
                python3 "$SCRIPT_DIR/social-stream-client.py" --send "$line" --session "$SESSION_ID" 2>/dev/null || true
                sleep 2  # メッセージ間隔
            fi
        done < "$OUTPUT_DIR/script.md"

        # 進捗メトリクス送信
        log_info "進捗メトリクスを送信中..."
        METRICS_JSON="{\"chatname\":\"📊 Miyabi Stats\",\"chatmessage\":\"過去${DAYS}日分: ${COMMIT_COUNT}コミット、${AUDIO_COUNT}音声ファイル生成完了！\",\"type\":\"miyabi-metrics\"}"
        python3 "$SCRIPT_DIR/social-stream-client.py" --send-content "$METRICS_JSON" --session "$SESSION_ID" 2>/dev/null || true

        log_success "Social Stream Ninja統合完了"

        echo ""
        log_info "📺 OBS Browser Source URL:"
        echo "   https://socialstream.ninja/dock.html?session=$SESSION_ID&channel=1"
        echo ""
        log_info "💡 次のステップ:"
        echo "   1. OBSで上記URLをBrowser Sourceに追加"
        echo "   2. YouTube/Twitchでストリーミング開始"
        echo ""

        # セッション情報を保存（クリーンアップ後も残す）
        echo "$SESSION_ID" > "$OUTPUT_DIR/.stream-session"
    fi
fi

# クリーンアップ
log_info "🧹 一時ファイルをクリーンアップ中..."
rm -f script.md voicevox_requests.json
rm -rf audio

# VOICEVOX Engine停止
if $START_ENGINE && ! $KEEP_ENGINE && [ -n "$ENGINE_PID" ]; then
    log_info "VOICEVOX Engineを停止中..."
    kill "$ENGINE_PID" 2>/dev/null || true
    log_success "VOICEVOX Engine停止完了"
fi

# 完了メッセージ
echo ""
echo "============================================================"
log_success "🎉 全工程完了！"
echo "============================================================"
echo ""
log_info "📁 出力ディレクトリ: $OUTPUT_DIR"
log_info "📝 台本: $OUTPUT_DIR/script.md"
log_info "🎤 音声: $OUTPUT_DIR/audio/*.wav"
if $GENERATE_THUMBNAIL; then
    log_info "🎨 サムネイル: $OUTPUT_DIR/thumbnail.png"
fi
if $GENERATE_VIDEO; then
    log_info "🎬 動画: $OUTPUT_DIR/miyabi-progress.mp4"
fi
echo ""
log_info "📋 次のステップ:"
echo "  1. 台本を確認: cat $OUTPUT_DIR/script.md"
echo "  2. 音声を再生: afplay $OUTPUT_DIR/audio/speaker0_000.wav"
if $GENERATE_THUMBNAIL; then
    echo "  3. サムネイルを確認: open $OUTPUT_DIR/thumbnail.png"
fi
if $GENERATE_VIDEO; then
    if $GENERATE_THUMBNAIL; then
        echo "  4. 動画を確認: open $OUTPUT_DIR/miyabi-progress.mp4"
        echo "  5. YouTubeにアップロード"
    else
        echo "  3. 動画を確認: open $OUTPUT_DIR/miyabi-progress.mp4"
        echo "  4. YouTubeにアップロード"
    fi
else
    if $GENERATE_THUMBNAIL; then
        echo "  4. 動画生成: ./miyabi-narrate.sh -v"
        echo "  5. 動画編集ソフトで編集"
    else
        echo "  3. 動画生成: ./miyabi-narrate.sh -v"
        echo "  4. 動画編集ソフトで編集"
    fi
fi
echo ""

# 統計情報
if [ -d "$OUTPUT_DIR/audio" ]; then
    AUDIO_COUNT=$(ls "$OUTPUT_DIR/audio"/*.wav 2>/dev/null | wc -l)
    AUDIO_SIZE=$(du -sh "$OUTPUT_DIR/audio" | awk '{print $1}')
    COMMIT_COUNT=$(git log --oneline --since="$DAYS days ago" 2>/dev/null | wc -l | xargs)

    echo "📊 統計情報:"
    echo "  - 音声ファイル数: $AUDIO_COUNT 件"
    echo "  - 合計サイズ: $AUDIO_SIZE"
    echo ""

    # Lifecycle Hook: NarrationAgent Complete (Claude Code Headless Mode)
    COMPLETE_HOOK="../.claude/hooks/narration-complete-headless.sh"
    if [ -x "$COMPLETE_HOOK" ]; then
        "$COMPLETE_HOOK" "$AUDIO_COUNT" "$AUDIO_SIZE" "$COMMIT_COUNT" &
    fi
fi

exit 0
