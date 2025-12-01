#!/bin/bash
# =============================================================================
# tmux Auto-Rotation Monitor
# =============================================================================
# 自動的にウィンドウをローテーションしてモニタリング
# Usage: ./tmux-auto-rotate.sh [interval_seconds] [mode]
# Modes: all, orchestras, teams, summary
# =============================================================================

SESSION="miyabi-deploy"
INTERVAL=${1:-5}  # デフォルト5秒
MODE=${2:-all}    # デフォルトは全ウィンドウ

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ウィンドウリストを取得
get_windows() {
    case $MODE in
        orchestras)
            tmux list-windows -t $SESSION -F "#{window_index}:#{window_name}" | grep -E "orchestra|summary"
            ;;
        teams)
            tmux list-windows -t $SESSION -F "#{window_index}:#{window_name}" | grep -E "team-|mugen-|majin-|codex-"
            ;;
        summary)
            tmux list-windows -t $SESSION -F "#{window_index}:#{window_name}" | grep -E "summary|monitor"
            ;;
        all)
            tmux list-windows -t $SESSION -F "#{window_index}:#{window_name}"
            ;;
    esac
}

# ヘッダー表示
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🎭 MIYABI ORCHESTRA AUTO-ROTATION MONITOR                ║${NC}"
    echo -e "${CYAN}║     Mode: ${YELLOW}$MODE${CYAN} | Interval: ${YELLOW}${INTERVAL}s${CYAN}                            ║${NC}"
    echo -e "${CYAN}║     Press ${RED}Ctrl+C${CYAN} to stop                                    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# メインループ
main() {
    echo -e "${GREEN}Starting auto-rotation...${NC}"
    echo -e "Session: ${BLUE}$SESSION${NC}"
    echo -e "Mode: ${YELLOW}$MODE${NC}"
    echo -e "Interval: ${YELLOW}${INTERVAL}s${NC}"
    echo ""

    # セッション存在確認
    if ! tmux has-session -t $SESSION 2>/dev/null; then
        echo -e "${RED}Error: Session '$SESSION' not found${NC}"
        exit 1
    fi

    WINDOWS=$(get_windows)
    WINDOW_COUNT=$(echo "$WINDOWS" | wc -l)

    echo -e "Windows to rotate: ${GREEN}$WINDOW_COUNT${NC}"
    echo "$WINDOWS" | while read line; do
        echo "  - $line"
    done
    echo ""
    echo -e "${YELLOW}Starting rotation in 3 seconds...${NC}"
    sleep 3

    while true; do
        for window_info in $WINDOWS; do
            window_index=$(echo $window_info | cut -d: -f1)
            window_name=$(echo $window_info | cut -d: -f2)

            show_header
            echo -e "Current Window: ${GREEN}[$window_index] $window_name${NC}"
            echo -e "Next switch in: ${YELLOW}${INTERVAL}s${NC}"
            echo ""
            echo "─────────────────────────────────────────────────────────────────"

            # ウィンドウ切り替え
            tmux select-window -t $SESSION:$window_index

            # 現在のペインの内容を少し表示
            tmux capture-pane -t $SESSION:$window_index -p | tail -20

            sleep $INTERVAL
        done
    done
}

# 使用方法表示
usage() {
    echo "Usage: $0 [interval_seconds] [mode]"
    echo ""
    echo "Modes:"
    echo "  all        - All windows (default)"
    echo "  orchestras - Only orchestra and summary windows"
    echo "  teams      - Only team windows"
    echo "  summary    - Only summary and monitor windows"
    echo ""
    echo "Examples:"
    echo "  $0           # 5 second interval, all windows"
    echo "  $0 10        # 10 second interval, all windows"
    echo "  $0 3 orchestras  # 3 second interval, orchestras only"
}

# 引数チェック
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
fi

# 実行
trap "echo -e '\n${YELLOW}Rotation stopped.${NC}'; exit 0" INT
main
