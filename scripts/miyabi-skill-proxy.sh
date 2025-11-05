#!/bin/bash
# Miyabi Skill Proxy
# Codexが直接スキルを呼び出せない制約を補うため、tmuxペインの出力から
# [[exec:コマンド]] 形式の指示を検出し、ホスト側で実際のCLIコマンドを実行する。
# 使い方:
#   ./scripts/miyabi-skill-proxy.sh watch --session miyabi-refactor --interval 5
#   Codex側ではメッセージ中に [[exec:miyabi agent run --issue 123]] のように埋め込む。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="$PROJECT_ROOT/.ai/skill-proxy"
LOG_FILE="$STATE_DIR/skill-proxy.log"
DEFAULT_SESSION="miyabi-refactor"
INTERVAL=5
DRY_RUN=0

log() {
    local level="$1"; shift
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    mkdir -p "$STATE_DIR"
    echo "[$ts] [$level] $*" | tee -a "$LOG_FILE" >&2
}

usage() {
    cat <<USAGE
Miyabi Skill Proxy

Usage:
  $0 watch [--session NAME] [--interval SEC] [--dry-run]
  $0 once  [--session NAME]

Options:
  --session   監視対象の tmux セッション（デフォルト: $DEFAULT_SESSION）
  --interval  監視間隔（秒）
  --dry-run   コマンドを実行せずログのみ出力

Codex からは [[exec:...]] 形式でメッセージを埋め込んでください。
USAGE
}

run_command() {
    local cmd="$1"
    if [[ $DRY_RUN -eq 1 ]]; then
        log INFO "[DRY-RUN] 実行予定コマンド: $cmd"
        return 0
    fi

    log INFO "コマンド実行開始: $cmd"
    set +e
    pushd "$PROJECT_ROOT" >/dev/null
    bash -lc "$cmd"
    local status=$?
    popd >/dev/null
    set -e

    if [[ $status -eq 0 ]]; then
        log INFO "コマンド成功: $cmd"
    else
        log ERROR "コマンド失敗 (exit=$status): $cmd"
    fi
    return $status
}

process_pane() {
    local pane_id="$1"
    local buffer
    buffer="$(tmux capture-pane -t "$pane_id" -p 2>/dev/null || true)"
    [[ -z "$buffer" ]] && return 0

    local cmd
    while IFS= read -r line; do
        if [[ "$line" =~ \[\[exec:(.*)\]\] ]]; then
            cmd="${BASH_REMATCH[1]}"
            cmd="$(echo "$cmd" | sed 's/^\s*//; s/\s*$//')"
            [[ -z "$cmd" ]] && continue

            local hash
            hash="$(printf '%s|%s' "$pane_id" "$cmd" | sha1sum | cut -d' ' -f1)"
            if [[ -f "$STATE_DIR/$hash" ]]; then
                continue
            fi

            mkdir -p "$STATE_DIR"
            printf '%s\n' "pane=$pane_id" "cmd=$cmd" "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATE_DIR/$hash"
            log INFO "検出: pane=$pane_id cmd=$cmd"
            run_command "$cmd"
        fi
    done <<< "$buffer"
}

run_once() {
    local session="$1"
    local panes
    panes="$(tmux list-panes -t "$session" -F '#{pane_id}' 2>/dev/null || true)"
    [[ -z "$panes" ]] && return 0
    while IFS= read -r pane_id; do
        [[ -z "$pane_id" ]] && continue
        process_pane "$pane_id"
    done <<< "$panes"
}

watch_loop() {
    local session="$1"
    log INFO "Skill Proxy 監視開始: session=$session interval=${INTERVAL}s"
    while true; do
        run_once "$session"
        sleep "$INTERVAL"
    done
}

main() {
    if [[ $# -lt 1 ]]; then
        usage
        exit 1
    fi

    local mode="$1"; shift
    local session="$DEFAULT_SESSION"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --session)
                session="$2"; shift 2 ;;
            --interval)
                INTERVAL="$2"; shift 2 ;;
            --dry-run)
                DRY_RUN=1; shift ;;
            -h|--help)
                usage; exit 0 ;;
            *)
                echo "Unknown option: $1" >&2
                usage
                exit 1 ;;
        esac
    done

    case "$mode" in
        watch)
            watch_loop "$session" ;;
        once)
            run_once "$session" ;;
        *)
            usage
            exit 1 ;;
    esac
}

main "$@"
