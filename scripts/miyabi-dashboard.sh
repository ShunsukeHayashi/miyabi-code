#!/bin/bash
# Miyabi Orchestra Real-time Dashboard v4.0
# 4-window Orchestra対応 - リアルタイム監視ダッシュボード

set -euo pipefail

# カラー定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# パス定義
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly PANE_MAPPING="$PROJECT_ROOT/.ai/config/pane-mapping.json"
readonly TASKS_JSON="$PROJECT_ROOT/.ai/queue/tasks.json"
readonly METRICS_JSON="$PROJECT_ROOT/.ai/metrics/performance-metrics.json"

# 更新間隔（秒）
readonly REFRESH_INTERVAL=5

# 画面クリアとヘッダー表示
print_dashboard_header() {
    clear
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}${MAGENTA}🎭 Miyabi Orchestra Dashboard${NC}                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Architecture:${NC} 4-window | ${BLUE}Updated:${NC} $timestamp            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Quick Status Bar
print_quick_status() {
    local total_agents=11
    local active_count=0
    local idle_count=0
    local crashed_count=0

    # Agent状態カウント
    for pane_id in $(jq -r '[.windows.Core.agents, .windows.Business.agents] | add | keys[]' "$PANE_MAPPING" 2>/dev/null || echo ""); do
        if tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^$pane_id$"; then
            local process
            process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}' 2>/dev/null || echo "unknown")

            if [ "$process" = "node" ]; then
                local output
                output=$(tmux capture-pane -t "$pane_id" -p 2>/dev/null | tail -5 || echo "")

                if echo "$output" | grep -q "Working\|実装\|レビュー\|準備OK"; then
                    ((active_count++))
                else
                    ((idle_count++))
                fi
            else
                ((crashed_count++))
            fi
        else
            ((crashed_count++))
        fi
    done

    local health_score=$(((active_count + idle_count) * 100 / total_agents))

    # ステータスバー表示
    echo -e "${BOLD}Quick Status:${NC}"
    echo -ne "  "

    # Active Agents
    echo -ne "${GREEN}●${NC} Active: ${GREEN}$active_count${NC}  "

    # Idle Agents
    echo -ne "${YELLOW}○${NC} Idle: ${YELLOW}$idle_count${NC}  "

    # Crashed
    if [ $crashed_count -gt 0 ]; then
        echo -ne "${RED}✗${NC} Crashed: ${RED}$crashed_count${NC}  "
    fi

    # Health Score
    if [ $health_score -ge 90 ]; then
        echo -e "| Health: ${GREEN}${health_score}%${NC} ${GREEN}✓${NC}"
    elif [ $health_score -ge 70 ]; then
        echo -e "| Health: ${YELLOW}${health_score}%${NC} ${YELLOW}⚠${NC}"
    else
        echo -e "| Health: ${RED}${health_score}%${NC} ${RED}✗${NC}"
    fi

    echo ""
}

# Core Window Status
print_core_status_compact() {
    echo -e "${BLUE}▼ Window 1: Core${NC}"

    local agents=$(jq -r '.windows.Core.agents | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji)"' "$PANE_MAPPING" 2>/dev/null || echo "")

    while IFS='|' read -r pane_id agent_name emoji; do
        [ -z "$pane_id" ] && continue

        if tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^$pane_id$"; then
            local process
            process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}' 2>/dev/null || echo "unknown")

            local status_icon
            if [ "$process" = "node" ]; then
                status_icon="${YELLOW}○${NC}"
            else
                status_icon="${RED}✗${NC}"
            fi

            echo -e "  $status_icon $emoji $agent_name"
        fi
    done <<< "$agents"

    echo ""
}

# Business Window Status
print_business_status_compact() {
    echo -e "${BLUE}▼ Window 2: Business${NC}"

    local agents=$(jq -r '.windows.Business.agents | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji)"' "$PANE_MAPPING" 2>/dev/null || echo "")

    while IFS='|' read -r pane_id agent_name emoji; do
        [ -z "$pane_id" ] && continue

        if tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^$pane_id$"; then
            local process
            process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}' 2>/dev/null || echo "unknown")

            local status_icon
            if [ "$process" = "node" ]; then
                status_icon="${YELLOW}○${NC}"
            else
                status_icon="${RED}✗${NC}"
            fi

            echo -e "  $status_icon $emoji $agent_name"
        fi
    done <<< "$agents"

    echo ""
}

# Active Tasks
print_active_tasks_dashboard() {
    echo -e "${BLUE}▼ Active Tasks${NC}"

    if [ ! -f "$TASKS_JSON" ]; then
        echo -e "  ${YELLOW}No tasks.json${NC}"
        echo ""
        return 0
    fi

    local task_count
    task_count=$(jq '.active_tasks | length' "$TASKS_JSON" 2>/dev/null || echo "0")

    if [ "$task_count" = "0" ]; then
        echo -e "  ${YELLOW}No active tasks${NC}"
    else
        echo -e "  ${GREEN}$task_count task(s)${NC}"
        jq -r '.active_tasks[:5][] | "  • #\(.issue_number) → \(.assigned_to)"' "$TASKS_JSON" 2>/dev/null || echo ""
    fi

    echo ""
}

# Footer
print_footer() {
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${YELLOW}Auto-refresh: ${REFRESH_INTERVAL}s${NC} | Press ${BOLD}Ctrl+C${NC} to exit"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
}

# Main display
display_dashboard() {
    print_dashboard_header
    print_quick_status
    print_core_status_compact
    print_business_status_compact
    print_active_tasks_dashboard
    print_footer
}

# Watch mode
watch_mode() {
    trap 'echo -e "\n${YELLOW}Dashboard stopped${NC}"; exit 0' SIGINT SIGTERM

    while true; do
        display_dashboard
        sleep "$REFRESH_INTERVAL"
    done
}

# Main
main() {
    local mode="${1:-watch}"

    case "$mode" in
        watch)
            watch_mode
            ;;
        once)
            display_dashboard
            ;;
        *)
            echo "Usage: $0 [watch|once]"
            exit 1
            ;;
    esac
}

main "$@"
