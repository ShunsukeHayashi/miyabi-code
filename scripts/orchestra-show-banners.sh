#!/bin/bash
# Miyabi Orchestra - Show Large Banners in Panes
# Version: 1.0.0
# Purpose: Display large ASCII art banners for each agent

set -euo pipefail

# Get terminal color codes (soft, eye-friendly colors)
get_color_code() {
    case "$1" in
        "カンナ") echo "\033[38;5;75m" ;;      # Soft Blue
        "カエデ") echo "\033[38;5;71m" ;;      # Soft Green
        "サクラ") echo "\033[38;5;175m" ;;     # Soft Pink
        "ツバキ") echo "\033[38;5;185m" ;;     # Soft Yellow
        "ボタン") echo "\033[38;5;173m" ;;     # Soft Orange
        "クモ") echo "\033[38;5;104m" ;;       # Soft Purple
        "Codex-1") echo "\033[38;5;73m" ;;     # Soft Cyan
        "Codex-2") echo "\033[38;5;109m" ;;    # Soft Light Cyan
        "Codex-3") echo "\033[38;5;110m" ;;    # Soft Light Blue
        "Codex-4") echo "\033[38;5;111m" ;;    # Soft Sky Blue
        *) echo "\033[0m" ;;
    esac
}

RESET="\033[0m"

# Show banner for a specific agent
show_agent_banner() {
    local agent_name="$1"
    local pane_id="$2"
    local color=$(get_color_code "$agent_name")

    # Clear the pane first
    tmux send-keys -t "$pane_id" C-l

    # Generate and display banner
    case "$agent_name" in
        "カンナ")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CONDUCTOR' && figlet -f small 'Kanna - Orchestrator' && echo -e '${RESET}'" Enter
            ;;
        "カエデ")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CODEGEN' && figlet -f small 'Kaede - Implementation' && echo -e '${RESET}'" Enter
            ;;
        "サクラ")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'REVIEW' && figlet -f small 'Sakura - Code Review' && echo -e '${RESET}'" Enter
            ;;
        "ツバキ")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'PR' && figlet -f small 'Tsubaki - Pull Request' && echo -e '${RESET}'" Enter
            ;;
        "ボタン")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'DEPLOY' && figlet -f small 'Botan - Deployment' && echo -e '${RESET}'" Enter
            ;;
        "クモ")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'SPIDER' && figlet -f small 'Kumo - Water Spider' && echo -e '${RESET}'" Enter
            ;;
        "Codex-1")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CODEX-1' && figlet -f small 'AI Coding Assistant' && echo -e '${RESET}'" Enter
            ;;
        "Codex-2")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CODEX-2' && figlet -f small 'AI Coding Assistant' && echo -e '${RESET}'" Enter
            ;;
        "Codex-3")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CODEX-3' && figlet -f small 'AI Coding Assistant' && echo -e '${RESET}'" Enter
            ;;
        "Codex-4")
            tmux send-keys -t "$pane_id" "clear && echo -e '${color}' && figlet -f banner 'CODEX-4' && figlet -f small 'AI Coding Assistant' && echo -e '${RESET}'" Enter
            ;;
    esac

    echo "✅ $agent_name バナー表示完了"
}

# Show all banners
show_all_banners() {
    echo "🎨 全エージェントバナーを表示中..."
    echo ""

    show_agent_banner "カンナ" "%1"
    show_agent_banner "カエデ" "%2"
    show_agent_banner "ツバキ" "%3"
    show_agent_banner "ボタン" "%4"
    show_agent_banner "サクラ" "%5"
    show_agent_banner "クモ" "%6"
    show_agent_banner "Codex-1" "%7"
    show_agent_banner "Codex-2" "%8"
    show_agent_banner "Codex-3" "%9"
    show_agent_banner "Codex-4" "%10"

    echo ""
    echo "✅ 全バナー表示完了"
}

# Main execution
case "${1:-all}" in
    all)
        show_all_banners
        ;;
    *)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 [all|agent_name pane_id]"
            echo ""
            echo "例:"
            echo "  $0 all                    # 全バナー表示"
            echo "  $0 カンナ %1              # カンナのバナーのみ表示"
            exit 1
        fi
        show_agent_banner "$1" "$2"
        ;;
esac
