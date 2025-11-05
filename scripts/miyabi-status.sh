#!/bin/bash
# Miyabi Orchestra Status Check Script v4.0
# 4-window Orchestra対応版

set -euo pipefail

# カラー定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m'

# パス定義
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly PANE_MAPPING="$PROJECT_ROOT/.ai/config/pane-mapping.json"
readonly TASKS_JSON="$PROJECT_ROOT/.ai/queue/tasks.json"

# ヘッダー表示
print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${MAGENTA}Miyabi Orchestra Status${NC} - 4-window Architecture          ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Window情報表示
print_window_info() {
    echo -e "${BLUE}═══ Window Configuration ═══${NC}"
    tmux list-windows -t Miyabi -F "  Window #{window_index}: #{window_name} (#{window_panes} panes) #{?window_active,${GREEN}[ACTIVE]${NC},}"
    echo ""
}

# Agent状態確認
check_agent_status() {
    local pane_id="$1"
    local agent_name="$2"
    local emoji="$3"

    # Paneが存在するか確認
    if ! tmux list-panes -a -F "#{pane_id}" | grep -q "^$pane_id$"; then
        echo -e "  ${RED}✗${NC} $emoji $agent_name ($pane_id): ${RED}PANE NOT FOUND${NC}"
        return 1
    fi

    # プロセス確認
    local process
    process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}' 2>/dev/null || echo "unknown")

    # 最新出力確認
    local recent_output
    recent_output=$(tmux capture-pane -t "$pane_id" -p 2>/dev/null | tail -5 | tr '\n' ' ' | head -c 80)

    # ステータス判定
    local status_icon status_text status_color
    if [ "$process" = "node" ]; then
        # Context使用率確認
        local context
        context=$(tmux capture-pane -t "$pane_id" -p 2>/dev/null | grep -oE '[0-9]+% context left' | tail -1 || echo "")

        if echo "$recent_output" | grep -q "Working\|実装\|レビュー"; then
            status_icon="${GREEN}●${NC}"
            status_text="ACTIVE"
            status_color="${GREEN}"
        elif [ -n "$context" ]; then
            status_icon="${YELLOW}●${NC}"
            status_text="IDLE ($context)"
            status_color="${YELLOW}"
        else
            status_icon="${YELLOW}○${NC}"
            status_text="READY"
            status_color="${YELLOW}"
        fi
    elif [ "$process" = "bash" ] || [ "$process" = "zsh" ]; then
        status_icon="${RED}✗${NC}"
        status_text="CRASHED (shell)"
        status_color="${RED}"
    else
        status_icon="${RED}?${NC}"
        status_text="UNKNOWN ($process)"
        status_color="${RED}"
    fi

    # 出力
    printf "  %s %s %-12s (%s): %b%-20s%b\n" \
        "$status_icon" "$emoji" "$agent_name" "$pane_id" \
        "$status_color" "$status_text" "${NC}"

    # 詳細モード: 最新出力も表示
    if [ "${VERBOSE:-0}" = "1" ]; then
        echo -e "    ${CYAN}└─${NC} $recent_output"
    fi
}

# Core Window Agents
print_core_agents() {
    echo -e "${BLUE}═══ Window 1: Core (Coding Flow) ═══${NC}"

    if [ ! -f "$PANE_MAPPING" ]; then
        echo -e "  ${RED}ERROR: pane-mapping.json not found${NC}"
        return 1
    fi

    # Core AgentsをJSON から読み込み
    local agents
    agents=$(jq -r '.windows.Core.agents | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji)"' "$PANE_MAPPING")

    while IFS='|' read -r pane_id agent_name emoji; do
        check_agent_status "$pane_id" "$agent_name" "$emoji"
    done <<< "$agents"

    echo ""
}

# Business Window Agents
print_business_agents() {
    echo -e "${BLUE}═══ Window 2: Business (Strategy & Growth) ═══${NC}"

    local agents
    agents=$(jq -r '.windows.Business.agents | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji)"' "$PANE_MAPPING")

    while IFS='|' read -r pane_id agent_name emoji; do
        check_agent_status "$pane_id" "$agent_name" "$emoji"
    done <<< "$agents"

    echo ""
}

# Monitor Window
print_monitor_status() {
    echo -e "${BLUE}═══ Window 3: Monitor (Observability) ═══${NC}"

    local components
    components=$(jq -r '.windows.Monitor.components | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji // "monitor")"' "$PANE_MAPPING")

    while IFS='|' read -r pane_id component_name emoji; do
        check_agent_status "$pane_id" "$component_name" "$emoji"
    done <<< "$components"

    echo ""
}

# Utility Window
print_utility_status() {
    echo -e "${BLUE}═══ Window 4: Utility (Tools) ═══${NC}"

    local components
    components=$(jq -r '.windows.Utility.components | to_entries[] | "\(.key)|\(.value.name)|\(.value.emoji // "tool")"' "$PANE_MAPPING")

    while IFS='|' read -r pane_id component_name emoji; do
        check_agent_status "$pane_id" "$component_name" "$emoji"
    done <<< "$components"

    echo ""
}

# Active Tasks表示
print_active_tasks() {
    echo -e "${BLUE}═══ Active Tasks ═══${NC}"

    if [ ! -f "$TASKS_JSON" ]; then
        echo -e "  ${YELLOW}No tasks.json found${NC}"
        return 0
    fi

    local task_count
    task_count=$(jq '.active_tasks | length' "$TASKS_JSON")

    if [ "$task_count" = "0" ]; then
        echo -e "  ${YELLOW}No active tasks${NC}"
    else
        echo -e "  ${GREEN}$task_count active task(s)${NC}"
        echo ""

        jq -r '.active_tasks[] | "  Issue #\(.issue_number) → \(.assigned_to) (pane: \(.pane)) - Status: \(.status)"' "$TASKS_JSON"
    fi

    echo ""
}

# サマリー表示
print_summary() {
    echo -e "${BLUE}═══ Summary ═══${NC}"

    # 全Agent数カウント
    local total_agents
    total_agents=$(jq '[.windows.Core.agents, .windows.Business.agents] | add | length' "$PANE_MAPPING")

    # 稼働中Agent数
    local active_count=0
    local crashed_count=0

    for pane_id in $(jq -r '[.windows.Core.agents, .windows.Business.agents] | add | keys[]' "$PANE_MAPPING"); do
        if tmux list-panes -a -F "#{pane_id}" | grep -q "^$pane_id$"; then
            local process
            process=$(tmux display-message -t "$pane_id" -p '#{pane_current_command}' 2>/dev/null || echo "unknown")

            if [ "$process" = "node" ]; then
                ((active_count++))
            else
                ((crashed_count++))
            fi
        else
            ((crashed_count++))
        fi
    done

    local health_score=$((active_count * 100 / total_agents))

    echo -e "  Total Agents:   $total_agents"
    echo -e "  Active:         ${GREEN}$active_count${NC}"
    echo -e "  Crashed/Error:  ${RED}$crashed_count${NC}"
    echo -e "  Health Score:   ${health_score}%"

    if [ $health_score -ge 90 ]; then
        echo -e "  Overall Status: ${GREEN}✓ EXCELLENT${NC}"
    elif [ $health_score -ge 70 ]; then
        echo -e "  Overall Status: ${YELLOW}⚠ GOOD${NC}"
    elif [ $health_score -ge 50 ]; then
        echo -e "  Overall Status: ${YELLOW}⚠ DEGRADED${NC}"
    else
        echo -e "  Overall Status: ${RED}✗ CRITICAL${NC}"
    fi

    echo ""
}

# メイン処理
main() {
    # オプション解析
    while getopts "v" opt; do
        case $opt in
            v)
                export VERBOSE=1
                ;;
            *)
                echo "Usage: $0 [-v]"
                echo "  -v: Verbose mode (show recent output)"
                exit 1
                ;;
        esac
    done

    print_header
    print_window_info
    print_core_agents
    print_business_agents
    print_monitor_status
    print_utility_status
    print_active_tasks
    print_summary

    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "  Run with ${YELLOW}-v${NC} flag for verbose mode"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

main "$@"
