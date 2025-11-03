#!/bin/bash
# Miyabi Orchestra - Status Checker
# Version: 1.0.0
# Purpose: Display current status of all Orchestra components

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
SESSION_NAME="miyabi-orchestra"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Miyabi Orchestra - Status Report${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}⏰ Generated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Check if tmux is running
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux is not installed${NC}"
    exit 1
fi

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Session '$SESSION_NAME' does not exist${NC}"
    echo ""
    echo -e "${BLUE}💡 Start Orchestra with:${NC}"
    echo -e "  ${YELLOW}./scripts/orchestra-quick-start.sh${NC}"
    echo ""
    exit 1
fi

# Get pane information
echo -e "${BLUE}┌──────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Agent Status                                      │${NC}"
echo -e "${BLUE}├──────────────────────────────────────────────────┤${NC}"

# Define expected agents
declare -A EXPECTED_AGENTS=(
    [1]="🎼 カンナ (Conductor)"
    [2]="🎹 カエデ (CodeGen)"
    [3]="🎺 サクラ (Review)"
    [4]="🥁 ツバキ (PR)"
    [5]="🎷 ボタン (Deploy)"
    [6]="🕷️ クモ (Water Spider)"
)

# Get pane list
pane_count=$(tmux list-panes -t "$SESSION_NAME" | wc -l)

for i in {1..6}; do
    agent_name="${EXPECTED_AGENTS[$i]}"

    if [ $i -le $pane_count ]; then
        # Get pane info
        pane_id=$(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}" | sed -n "${i}p")
        pane_cmd=$(tmux list-panes -t "$SESSION_NAME" -F "#{pane_current_command}" | sed -n "${i}p")

        # Determine status
        if [ "$pane_cmd" == "node" ] || [ "$pane_cmd" == "bash" ]; then
            status="${GREEN}[●]${NC} ONLINE"
        else
            status="${YELLOW}[○]${NC} UNKNOWN"
        fi

        printf "${BLUE}│${NC} %-50s ${status}  ${BLUE}│${NC}\n" "$agent_name ($pane_id)"
    else
        printf "${BLUE}│${NC} %-50s ${RED}[✗]${NC} OFFLINE ${BLUE}│${NC}\n" "$agent_name"
    fi
done

echo -e "${BLUE}└──────────────────────────────────────────────────┘${NC}"
echo ""

# Water Spider status
echo -e "${BLUE}🕷️  Water Spider Status:${NC}"
if [ -f "$WORKING_DIR/.ai/logs/water-spider.log" ]; then
    last_activity=$(tail -1 "$WORKING_DIR/.ai/logs/water-spider.log" 2>/dev/null)
    if [ -n "$last_activity" ]; then
        echo -e "  ${GREEN}✅ Active${NC}"
        echo -e "  ${BLUE}Last Activity:${NC} $last_activity"
    else
        echo -e "  ${YELLOW}⚠️  No activity detected${NC}"
    fi
else
    echo -e "  ${RED}❌ Not running (no log file)${NC}"
fi
echo ""

# Message Relay status
echo -e "${BLUE}🔗 Message Relay Status:${NC}"
if [ -f "$WORKING_DIR/.ai/logs/water-spider-relay.log" ]; then
    relay_count=$(wc -l < "$WORKING_DIR/.ai/logs/water-spider-relay.log")
    echo -e "  ${GREEN}✅ Active${NC}"
    echo -e "  ${BLUE}Total Relays:${NC} $relay_count"

    if [ $relay_count -gt 0 ]; then
        echo -e "  ${BLUE}Recent Relays:${NC}"
        tail -3 "$WORKING_DIR/.ai/logs/water-spider-relay.log" | sed 's/^/    /'
    fi
else
    echo -e "  ${YELLOW}⚠️  No relay activity${NC}"
fi
echo ""

# VOICEVOX status
echo -e "${BLUE}🔊 VOICEVOX Status:${NC}"
if pgrep -x "VOICEVOX" > /dev/null; then
    echo -e "  ${GREEN}✅ Running${NC}"

    if [ -d "/tmp/voicevox_queue" ]; then
        queue_count=$(ls /tmp/voicevox_queue/*.json 2>/dev/null | wc -l)
        echo -e "  ${BLUE}Queue:${NC} $queue_count items"
    fi
else
    echo -e "  ${YELLOW}⚠️  Not running${NC}"
fi
echo ""

# System Resources
echo -e "${BLUE}💻 System Resources:${NC}"
cpu_usage=$(ps -A -o %cpu | awk '{s+=$1} END {printf "%.1f%%", s}')
echo -e "  ${BLUE}CPU Usage:${NC} $cpu_usage"

mem_usage=$(ps -A -o %mem | awk '{s+=$1} END {printf "%.1f%%", s}')
echo -e "  ${BLUE}Memory Usage:${NC} $mem_usage"
echo ""

# Recent Logs
echo -e "${BLUE}📋 Recent Events (Last 5):${NC}"
if [ -f "$WORKING_DIR/.ai/logs/water-spider.log" ]; then
    tail -5 "$WORKING_DIR/.ai/logs/water-spider.log" | sed 's/^/  /'
else
    echo -e "  ${YELLOW}No logs available${NC}"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💡 Commands:${NC}"
echo -e "  ${YELLOW}./scripts/orchestra-logs.sh${NC}      - View live logs"
echo -e "  ${YELLOW}./scripts/assign-task.sh${NC}         - Assign task to agent"
echo -e "  ${YELLOW}tmux attach -t $SESSION_NAME${NC}  - Attach to session"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
