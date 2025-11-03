#!/bin/bash
# Miyabi Orchestra - Enhanced Pane UI/UX
# Version: 1.0.0
# Purpose: Display Agent names and current tasks with colors and large text

set -euo pipefail

# Function to get pane color by agent name
get_pane_color() {
    case "$1" in
        "カンナ") echo "colour75" ;;     # Soft Blue - Conductor
        "カエデ") echo "colour71" ;;     # Soft Green - CodeGen
        "サクラ") echo "colour175" ;;    # Soft Pink - Review
        "ツバキ") echo "colour185" ;;    # Soft Yellow - PR
        "ボタン") echo "colour173" ;;    # Soft Orange - Deploy
        "クモ") echo "colour104" ;;      # Soft Purple - Water Spider
        "Codex-1") echo "colour73" ;;    # Soft Cyan - Codex-1
        "Codex-2") echo "colour109" ;;   # Soft Light Cyan - Codex-2
        "Codex-3") echo "colour110" ;;   # Soft Light Blue - Codex-3
        "Codex-4") echo "colour111" ;;   # Soft Sky Blue - Codex-4
        *) echo "default" ;;
    esac
}

# Function to get pane background color by agent name and status
get_pane_bg_color() {
    local agent="$1"
    local status="${2:-stopped}"  # Default: stopped

    # Status-based color modification
    case "$status" in
        "in_progress"|"実行中")
            # IN PROGRESS: Soft active colors (not too bright)
            case "$agent" in
                "カンナ") echo "colour24" ;;     # Soft Active Blue - Conductor
                "カエデ") echo "colour29" ;;     # Soft Active Green - CodeGen
                "サクラ") echo "colour132" ;;    # Soft Active Pink - Review
                "ツバキ") echo "colour143" ;;    # Soft Active Yellow - PR
                "ボタン") echo "colour137" ;;    # Soft Active Orange - Deploy
                "クモ") echo "colour61" ;;       # Soft Active Purple - Spider
                "Codex-1") echo "colour31" ;;    # Soft Active Cyan - Codex
                "Codex-2") echo "colour37" ;;    # Soft Active Light Cyan
                "Codex-3") echo "colour38" ;;    # Soft Active Light Blue
                "Codex-4") echo "colour74" ;;    # Soft Active Sky Blue
                *) echo "colour29" ;;            # Default: Soft Green
            esac
            ;;
        "stopped"|"待機中")
            # STOPPED: Very dark/subtle colors
            case "$agent" in
                "カンナ") echo "colour17" ;;     # Very Dark Blue - Conductor
                "カエデ") echo "colour22" ;;     # Very Dark Green - CodeGen
                "サクラ") echo "colour53" ;;     # Very Dark Pink - Review
                "ツバキ") echo "colour58" ;;     # Very Dark Yellow - PR
                "ボタン") echo "colour94" ;;     # Very Dark Orange - Deploy
                "クモ") echo "colour54" ;;       # Very Dark Purple - Spider
                "Codex-1") echo "colour23" ;;    # Very Dark Cyan - Codex
                "Codex-2") echo "colour24" ;;    # Very Dark Light Cyan
                "Codex-3") echo "colour25" ;;    # Very Dark Light Blue
                "Codex-4") echo "colour66" ;;    # Very Dark Sky Blue
                *) echo "default" ;;
            esac
            ;;
        "completed"|"完了")
            # COMPLETED: Neutral grey
            echo "colour237"  # Neutral grey for all completed agents
            ;;
        *)
            # Default to stopped
            case "$agent" in
                "カンナ") echo "colour17" ;;
                "カエデ") echo "colour22" ;;
                "サクラ") echo "colour53" ;;
                "ツバキ") echo "colour58" ;;
                "ボタン") echo "colour94" ;;
                "クモ") echo "colour54" ;;
                "Codex-1") echo "colour23" ;;
                "Codex-2") echo "colour24" ;;
                "Codex-3") echo "colour25" ;;
                "Codex-4") echo "colour66" ;;
                *) echo "default" ;;
            esac
            ;;
    esac
}

# Function to get agent emoji
get_agent_emoji() {
    case "$1" in
        "カンナ") echo "🎼" ;;
        "カエデ") echo "🎹" ;;
        "サクラ") echo "🎺" ;;
        "ツバキ") echo "🥁" ;;
        "ボタン") echo "🎷" ;;
        "クモ") echo "🕷️" ;;
        "Codex-1") echo "🔷" ;;
        "Codex-2") echo "🔷" ;;
        "Codex-3") echo "🔷" ;;
        "Codex-4") echo "🔷" ;;
        *) echo "🤖" ;;
    esac
}

# Function to get agent pane ID
get_agent_pane() {
    case "$1" in
        "カンナ") echo "%1" ;;
        "カエデ") echo "%2" ;;
        "サクラ") echo "%5" ;;
        "ツバキ") echo "%3" ;;
        "ボタン") echo "%4" ;;
        "クモ") echo "%6" ;;
        "Codex-1") echo "%7" ;;
        "Codex-2") echo "%8" ;;
        "Codex-3") echo "%9" ;;
        "Codex-4") echo "%10" ;;
        *) echo "" ;;
    esac
}

# Set enhanced pane UI for a specific agent
set_pane_ui() {
    local agent_name="$1"
    local task_description="${2:-待機中}"
    local status="${3:-stopped}"  # New parameter: stopped, in_progress, completed

    local pane_id=$(get_agent_pane "$agent_name")
    local emoji=$(get_agent_emoji "$agent_name")
    local color=$(get_pane_color "$agent_name")
    local bg_color=$(get_pane_bg_color "$agent_name" "$status")

    if [ -z "$pane_id" ]; then
        echo "⚠️  不明なAgent: $agent_name"
        return 1
    fi

    # Check if pane exists
    if ! tmux list-panes -a -F "#{pane_id}" | grep -q "^${pane_id}$"; then
        echo "⚠️  Pane $pane_id が存在しません"
        return 1
    fi

    # Set pane border color (extra emphasis for Conductor or active status)
    if [ "$status" = "in_progress" ] || [ "$status" = "実行中" ]; then
        # Active agents get bright, blinking borders
        tmux set-option -p -t "$pane_id" pane-border-style "fg=$color,bold" 2>/dev/null || true
        tmux set-option -p -t "$pane_id" pane-active-border-style "fg=$color,bold,blink" 2>/dev/null || true
    elif [ "$agent_name" = "カンナ" ]; then
        # Conductor gets EXTRA BOLD borders
        tmux set-option -p -t "$pane_id" pane-border-style "fg=$color,bold" 2>/dev/null || true
        tmux set-option -p -t "$pane_id" pane-active-border-style "fg=$color,bold,blink" 2>/dev/null || true
    else
        # Normal borders for stopped/idle agents
        tmux set-option -p -t "$pane_id" pane-border-style "fg=$color" 2>/dev/null || true
        tmux set-option -p -t "$pane_id" pane-active-border-style "fg=$color,bold" 2>/dev/null || true
    fi

    # Set pane background color
    tmux set-option -p -t "$pane_id" window-style "bg=$bg_color" 2>/dev/null || true
    tmux set-option -p -t "$pane_id" window-active-style "bg=$bg_color" 2>/dev/null || true

    # Set pane title with status indicator
    local status_emoji=""
    case "$status" in
        "in_progress"|"実行中")
            status_emoji="▶️"
            ;;
        "stopped"|"待機中")
            status_emoji="⏸️"
            ;;
        "completed"|"完了")
            status_emoji="✅"
            ;;
    esac

    if [ "$agent_name" = "カンナ" ]; then
        local title="⭐ $emoji $agent_name 【CONDUCTOR】 | $status_emoji $task_description ⭐"
    else
        local title="$emoji $agent_name | $status_emoji $task_description"
    fi
    tmux select-pane -t "$pane_id" -T "$title" 2>/dev/null || true

    echo "✅ $agent_name ペインを更新: [$status] $task_description"
}

# Initialize all panes with default UI
initialize_all_panes() {
    echo "🎨 Miyabi Orchestra UI/UX を初期化中..."
    echo ""

    set_pane_ui "カンナ" "オーケストレーター | タスク割り当て待機中"
    set_pane_ui "カエデ" "コード実装 | タスク待機中"
    set_pane_ui "サクラ" "コードレビュー | タスク待機中"
    set_pane_ui "ツバキ" "PR作成 | タスク待機中"
    set_pane_ui "ボタン" "デプロイ | タスク待機中"
    set_pane_ui "クモ" "監視・中継 | 常時稼働中"
    set_pane_ui "Codex-1" "Codex実装 | タスク待機中"
    set_pane_ui "Codex-2" "Codex実装 | タスク待機中"
    set_pane_ui "Codex-3" "Codex実装 | タスク待機中"
    set_pane_ui "Codex-4" "Codex実装 | タスク待機中"

    echo ""
    echo "✅ すべてのペインUIを初期化しました（10 Agents）"
    echo ""
    echo "📊 現在のペインタイトル:"
    tmux list-panes -F "  #{pane_id}: #{pane_title}"
}

# Update task for a specific agent
update_agent_task() {
    local agent_name="$1"
    local task_description="$2"
    local status="${3:-stopped}"  # Optional status parameter

    set_pane_ui "$agent_name" "$task_description" "$status"
}

# Main execution
case "${1:-init}" in
    init)
        initialize_all_panes
        ;;
    update)
        if [ $# -lt 3 ]; then
            echo "Usage: $0 update <agent_name> <task_description> [status]"
            echo ""
            echo "例: $0 update カエデ 'Issue #270 実装中' in_progress"
            echo "    $0 update カエデ 'Issue #270 実装中' stopped"
            exit 1
        fi
        update_agent_task "$2" "$3" "${4:-stopped}"
        ;;
    list)
        echo "📊 現在のペイン状態:"
        tmux list-panes -F "  #{pane_id}: #{pane_title} (#{pane_width}x#{pane_height})"
        ;;
    *)
        echo "Usage:"
        echo "  $0 init                                        # 全ペイン初期化"
        echo "  $0 update <agent> <task> [status]             # 特定Agentのタスク更新"
        echo "  $0 list                                        # ペイン一覧表示"
        echo ""
        echo "Status: stopped (⏸️), in_progress (▶️), completed (✅)"
        echo ""
        echo "例:"
        echo "  $0 init"
        echo "  $0 update カエデ 'Issue #270 実装中' in_progress"
        echo "  $0 update サクラ 'レビュー完了' completed"
        echo "  $0 list"
        exit 1
        ;;
esac
