#!/bin/bash
# =============================================================================
# tmux Live Dashboard - 全オーケストラ統合モニター
# =============================================================================
# 1つの画面で全オーケストラのステータスをリアルタイム表示
# Usage: ./tmux-live-dashboard.sh
# =============================================================================

SESSION="miyabi-deploy"
REFRESH_INTERVAL=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# システムステータス取得
get_system_status() {
    # MUGEN
    MUGEN_CLAUDE=$(ssh mugen 'ps aux | grep -c "[c]laude"' 2>/dev/null || echo "?")
    MUGEN_CODEX=$(ssh mugen 'ps aux | grep -c "[c]odex"' 2>/dev/null || echo "?")
    MUGEN_LOAD=$(ssh mugen 'cat /proc/loadavg | cut -d" " -f1' 2>/dev/null || echo "?")
    MUGEN_MEM=$(ssh mugen 'free -h | grep Mem | awk "{print \$4}"' 2>/dev/null || echo "?")

    # MAJIN
    MAJIN_CLAUDE=$(ssh majin 'ps aux | grep -c "[c]laude"' 2>/dev/null || echo "?")
    MAJIN_LOAD=$(ssh majin 'cat /proc/loadavg | cut -d" " -f1' 2>/dev/null || echo "?")
    MAJIN_MEM=$(ssh majin 'free -h | grep Mem | awk "{print \$4}"' 2>/dev/null || echo "?")
}

# オーケストラログ取得
get_orchestra_status() {
    ORCH_A=$(tail -20 /tmp/orchestra-a-status.log 2>/dev/null | grep -E "Progress|Team|Blockers" | tail -6)
    ORCH_B=$(tail -20 /tmp/orchestra-b-status.log 2>/dev/null | grep -E "Progress|Team|Blockers" | tail -6)
    ORCH_C=$(tail -20 /tmp/orchestra-c-status.log 2>/dev/null | grep -E "Progress|Team|Blockers" | tail -6)
}

# ダッシュボード描画
draw_dashboard() {
    clear

    # Header
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🎭 MIYABI 172-AGENT LIVE DASHBOARD                         ║"
    echo "║                         $(date '+%Y-%m-%d %H:%M:%S')                                    ║"
    echo "╠═══════════════════════════════════════════════════════════════════════════════╣"
    echo -e "${NC}"

    # System Resources
    echo -e "${YELLOW}${BOLD}【SYSTEM RESOURCES】${NC}"
    echo "┌─────────────────────────────────────┬─────────────────────────────────────┐"
    printf "│ ${BLUE}⚡ MUGEN${NC}                            │ ${MAGENTA}⚡ MAJIN${NC}                            │\n"
    printf "│   Claude: %-4s  Codex: %-4s        │   Claude: %-4s                      │\n" "$MUGEN_CLAUDE" "$MUGEN_CODEX" "$MAJIN_CLAUDE"
    printf "│   Load: %-6s  Mem: %-8s      │   Load: %-6s  Mem: %-8s      │\n" "$MUGEN_LOAD" "$MUGEN_MEM" "$MAJIN_LOAD" "$MAJIN_MEM"
    echo "└─────────────────────────────────────┴─────────────────────────────────────┘"
    echo ""

    # Total Agents
    TOTAL=$((MUGEN_CLAUDE + MUGEN_CODEX + MAJIN_CLAUDE))
    echo -e "${GREEN}${BOLD}📊 TOTAL AGENTS: $TOTAL${NC}"
    echo ""

    # Orchestra Status
    echo -e "${YELLOW}${BOLD}【ORCHESTRA STATUS】${NC}"
    echo "┌─────────────────────────────────────────────────────────────────────────────┐"

    # Orchestra A
    echo -e "│ ${BLUE}🎼 ORCHESTRA-A (Infrastructure) - 50 agents${NC}"
    if [ -n "$ORCH_A" ]; then
        echo "$ORCH_A" | while read line; do
            printf "│   %s\n" "$line"
        done
    else
        echo "│   [Waiting for status report...]"
    fi
    echo "│"

    # Orchestra B
    echo -e "│ ${GREEN}🎼 ORCHESTRA-B (Development) - 60 agents${NC}"
    if [ -n "$ORCH_B" ]; then
        echo "$ORCH_B" | while read line; do
            printf "│   %s\n" "$line"
        done
    else
        echo "│   [Waiting for status report...]"
    fi
    echo "│"

    # Orchestra C
    echo -e "│ ${MAGENTA}🎼 ORCHESTRA-C (Business) - 55 agents${NC}"
    if [ -n "$ORCH_C" ]; then
        echo "$ORCH_C" | while read line; do
            printf "│   %s\n" "$line"
        done
    else
        echo "│   [Waiting for status report...]"
    fi

    echo "└─────────────────────────────────────────────────────────────────────────────┘"
    echo ""

    # Recent Activity (Last 5 lines from each orchestra log)
    echo -e "${YELLOW}${BOLD}【RECENT ACTIVITY】${NC}"
    echo "┌─────────────────────────────────────────────────────────────────────────────┐"

    echo "│ Latest from Orchestra-A:"
    tail -2 /tmp/orchestra-a-status.log 2>/dev/null | while read line; do
        printf "│   %.75s\n" "$line"
    done

    echo "│ Latest from Orchestra-B:"
    tail -2 /tmp/orchestra-b-status.log 2>/dev/null | while read line; do
        printf "│   %.75s\n" "$line"
    done

    echo "│ Latest from Orchestra-C:"
    tail -2 /tmp/orchestra-c-status.log 2>/dev/null | while read line; do
        printf "│   %.75s\n" "$line"
    done

    echo "└─────────────────────────────────────────────────────────────────────────────┘"
    echo ""

    # Footer
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────────────────────${NC}"
    echo -e "  ${YELLOW}[Ctrl+C]${NC} Stop  │  ${YELLOW}[r]${NC} Rotate windows  │  Refresh: ${GREEN}${REFRESH_INTERVAL}s${NC}"
}

# メインループ
main() {
    echo "Starting Live Dashboard..."
    sleep 1

    while true; do
        get_system_status
        get_orchestra_status
        draw_dashboard
        sleep $REFRESH_INTERVAL
    done
}

trap "echo -e '\n${YELLOW}Dashboard stopped.${NC}'; exit 0" INT
main
