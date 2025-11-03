#!/bin/bash

# VOICEVOX Queue Processor
# キューディレクトリ内の音声合成リクエストを処理するデーモン
#
# 機能:
# - /tmp/voicevox_queue/*.json を監視
# - VOICEVOX API経由で音声合成
# - 生成された音声を再生
# - 処理済みキューファイルを削除
#
# 使い方: ./voicevox-queue-processor.sh [--once|--daemon]
#   --once   : 1回だけ処理して終了
#   --daemon : 無限ループで監視（デフォルト）

set -euo pipefail

# Configuration
QUEUE_DIR="/tmp/voicevox_queue"
VOICEVOX_API_BASE="${VOICEVOX_API_BASE:-http://localhost:50021}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"  # seconds
AUDIO_PLAYER="${AUDIO_PLAYER:-afplay}"  # macOS default, use 'aplay' for Linux

# Processing mode
MODE="${1:---daemon}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Check dependencies
check_dependencies() {
    local missing_deps=()

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v "$AUDIO_PLAYER" &> /dev/null; then
        missing_deps+=("$AUDIO_PLAYER")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Install with: brew install ${missing_deps[*]}"
        exit 1
    fi
}

# Check VOICEVOX API availability
check_voicevox_api() {
    if ! curl -s --connect-timeout 3 "${VOICEVOX_API_BASE}/version" > /dev/null 2>&1; then
        log_error "VOICEVOX API not available at ${VOICEVOX_API_BASE}"
        log_error "Start VOICEVOX Engine first"
        return 1
    fi
    return 0
}

# Process a single queue file
process_queue_file() {
    local queue_file="$1"
    local temp_audio="/tmp/voicevox_audio_$$.wav"

    log_info "Processing: $(basename "$queue_file")"

    # Parse JSON using jq
    if ! jq empty "$queue_file" 2>/dev/null; then
        log_error "Invalid JSON: $queue_file"
        rm -f "$queue_file"
        return 1
    fi

    local text
    local speaker
    local speed_scale

    text=$(jq -r '.text' "$queue_file")
    speaker=$(jq -r '.speaker // 3' "$queue_file")
    speed_scale=$(jq -r '.speedScale // 1.0' "$queue_file")

    if [ -z "$text" ] || [ "$text" = "null" ]; then
        log_error "Empty text in: $queue_file"
        rm -f "$queue_file"
        return 1
    fi

    log_info "Text: $text"
    log_info "Speaker: $speaker, Speed: ${speed_scale}x"

    # Step 1: Generate audio query
    local query_json
    if ! query_json=$(curl -s -X POST \
        "${VOICEVOX_API_BASE}/audio_query?speaker=${speaker}" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$text\"}"); then
        log_error "Failed to create audio query"
        return 1
    fi

    # Step 2: Modify speed scale
    query_json=$(echo "$query_json" | jq --argjson speed "$speed_scale" '.speedScale = $speed')

    # Step 3: Synthesize audio
    if ! curl -s -X POST \
        "${VOICEVOX_API_BASE}/synthesis?speaker=${speaker}" \
        -H "Content-Type: application/json" \
        -d "$query_json" \
        -o "$temp_audio"; then
        log_error "Failed to synthesize audio"
        rm -f "$temp_audio"
        return 1
    fi

    # Step 4: Play audio
    if [ -f "$temp_audio" ] && [ -s "$temp_audio" ]; then
        log_info "Playing audio..."
        if $AUDIO_PLAYER "$temp_audio" 2>/dev/null; then
            log_success "Played: $text"
        else
            log_warn "Audio player failed, but synthesis succeeded"
        fi
        rm -f "$temp_audio"
    else
        log_error "Generated audio file is empty or missing"
        return 1
    fi

    # Step 5: Remove processed queue file
    rm -f "$queue_file"
    log_success "Processed and removed: $(basename "$queue_file")"

    return 0
}

# Process all queue files
process_queue() {
    # Create queue directory if it doesn't exist
    mkdir -p "$QUEUE_DIR"

    # Find and process all .json files
    local processed_count=0
    local failed_count=0

    while IFS= read -r -d '' queue_file; do
        if process_queue_file "$queue_file"; then
            ((processed_count++))
        else
            ((failed_count++))
        fi
    done < <(find "$QUEUE_DIR" -name "*.json" -type f -print0 2>/dev/null | sort -z)

    if [ $processed_count -gt 0 ]; then
        log_success "Processed $processed_count queue file(s)"
    fi

    if [ $failed_count -gt 0 ]; then
        log_warn "Failed to process $failed_count queue file(s)"
    fi

    return 0
}

# Main daemon loop
daemon_mode() {
    log_info "VOICEVOX Queue Processor started (daemon mode)"
    log_info "Queue directory: $QUEUE_DIR"
    log_info "API endpoint: $VOICEVOX_API_BASE"
    log_info "Poll interval: ${POLL_INTERVAL}s"
    log_info "Press Ctrl+C to stop"

    # Check API availability once at start
    if ! check_voicevox_api; then
        log_warn "VOICEVOX API not available, will retry on each poll"
    fi

    while true; do
        # Check API and process queue
        if check_voicevox_api; then
            process_queue
        else
            log_warn "VOICEVOX API unavailable, skipping this cycle"
        fi

        sleep "$POLL_INTERVAL"
    done
}

# One-shot mode
once_mode() {
    log_info "VOICEVOX Queue Processor (one-shot mode)"

    if ! check_voicevox_api; then
        log_error "VOICEVOX API not available"
        exit 1
    fi

    process_queue
    log_info "Processing complete"
}

# Main
main() {
    # Check dependencies
    check_dependencies

    # Run in appropriate mode
    case "$MODE" in
        --once)
            once_mode
            ;;
        --daemon|*)
            daemon_mode
            ;;
    esac
}

# Trap Ctrl+C for clean exit
trap 'log_info "Shutting down..."; exit 0' INT TERM

main
