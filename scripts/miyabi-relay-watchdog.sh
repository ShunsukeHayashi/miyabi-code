#!/bin/bash
# Miyabi Relay Watchdog
# 各エージェント間のトリガーメッセージが存在するか簡易チェックするスクリプト。
# 期待フォーマット: [カエデ→サクラ] レビュー依頼: ...

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PANE_MAP_FILE="$PROJECT_ROOT/.ai/orchestra/pane-map.json"
SESSION="miyabi-refactor"
MAX_LINES=300
EXTRA_PATTERNS=()
OUTPUT_FORMAT="table"

usage() {
    cat <<USAGE
Miyabi Relay Watchdog

Usage:
  $0 [--session SESSION] [--pattern '[A→B]']

Options:
  --session  チェック対象の tmux セッション (default: $SESSION)
  --pattern  追加で確認したいメッセージパターン（複数指定可）
  --json     JSON形式で結果を出力
USAGE
}

if [[ $# -gt 0 ]]; then
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --session)
                SESSION="$2"; shift 2 ;;
            --pattern)
                EXTRA_PATTERNS+=("$2"); shift 2 ;;
            --json)
                OUTPUT_FORMAT="json"; shift ;;
            -h|--help)
                usage; exit 0 ;;
            *)
                echo "Unknown option: $1" >&2
                usage
                exit 1 ;;
        esac
    done
fi

if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux が見つかりません" >&2
    exit 1
fi

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "セッション $SESSION が存在しません" >&2
    exit 1
fi

# デフォルトのリレー順
DEFAULT_PATTERNS=(
  "みつけるん→しきるん"
  "しきるん→カエデ"
  "カエデ→サクラ"
  "サクラ→ツバキ"
  "ツバキ→ボタン"
  "ボタン→Conductor"
  "Conductor→みつけるん"
)

if [[ ${#EXTRA_PATTERNS[@]:-0} -gt 0 ]]; then
    DEFAULT_PATTERNS+=("${EXTRA_PATTERNS[@]}")
fi

results=()

if [[ "$OUTPUT_FORMAT" == "table" ]]; then
    printf "Miyabi Relay Watchdog (session: %s)\n" "$SESSION"
    printf "%-25s | %-6s | %s\n" "Pattern" "Found" "Pane"
    printf "%-25s-+-%-6s-+-%s\n" "------------------------" "------" "----------------"
fi

for pattern in "${DEFAULT_PATTERNS[@]}"; do
    pane_id=""
    # 送信元の推定: pattern の左側
    sender="${pattern%%→*}"

    if [[ -f "$PANE_MAP_FILE" ]] && command -v jq >/dev/null 2>&1; then
        pane_id="$(jq -r --arg agent "$sender" 'if has($agent) then .[$agent] else "" end' "$PANE_MAP_FILE" 2>/dev/null)"
    fi

    if [[ -z "$pane_id" ]]; then
        # タイトルからの推定
        panes="$(tmux list-panes -t "$SESSION" -F '#{pane_id}|#{pane_title}')"
        while IFS='|' read -r pid title; do
            if [[ "$title" == *"$sender"* ]]; then
                pane_id="$pid"
                break
            fi
        done <<< "$panes"
    fi

    if [[ -z "$pane_id" ]]; then
        if [[ "$OUTPUT_FORMAT" == "table" ]]; then
            printf "%-25s | %-6s | %s\n" "[$pattern]" "N/A" "sender pane not found"
        fi
        results+=("$pattern|N/A|sender pane not found")
        continue
    fi

    content="$(tmux capture-pane -t "$pane_id" -p -S -$MAX_LINES 2>/dev/null || true)"
    if printf '%s\n' "$content" | rg -q "\[$pattern\]"; then
        if [[ "$OUTPUT_FORMAT" == "table" ]]; then
            printf "%-25s | %-6s | %s\n" "[$pattern]" "YES" "$pane_id"
        fi
        results+=("$pattern|YES|$pane_id")
    else
        if [[ "$OUTPUT_FORMAT" == "table" ]]; then
            printf "%-25s | %-6s | %s\n" "[$pattern]" "NO" "$pane_id"
        fi
        results+=("$pattern|NO|$pane_id")
    fi

done

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    for entry in "${results[@]}"; do
        printf '%s\n' "$entry"
    done | python3 -c '
import json
import sys

items = []
for raw in sys.stdin:
    line = raw.strip()
    if not line:
        continue
    pattern, status, pane = line.split("|", 2)
    items.append({
        "pattern": pattern,
        "status": status,
        "pane_id": pane,
        "found": status == "YES"
    })

json.dump({"patterns": items}, sys.stdout, ensure_ascii=False, indent=2)
'
fi

exit 0
