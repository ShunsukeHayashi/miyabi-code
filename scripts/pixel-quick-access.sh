#!/bin/bash
# Miyabi Quick Access for Pixel SSH
# Usage: ./scripts/pixel-quick-access.sh <command> [args]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function show_help() {
    cat << EOF
📱 Miyabi Pixel Quick Access

Usage: ./scripts/pixel-quick-access.sh <command> [args]

Commands:
  status              Show all agents status
  view <agent>        View specific agent output
  send <agent> <msg>  Send message to agent
  list                List all agents
  attach              Attach to Miyabi session
  guide               Show Pixel operation guide

Agents:
  sakura      🎺 ReviewAgent
  kikyou      🌸 IssueAgent
  botan       🎷 DeploymentAgent
  conductor   🎼 Conductor
  sumire      🎻 RefresherAgent
  kasumi      📊 MarketResearchAgent
  ayame       📈 AnalyticsAgent
  tsubaki     🆕 PRAgent

Examples:
  ./scripts/pixel-quick-access.sh status
  ./scripts/pixel-quick-access.sh view sakura
  ./scripts/pixel-quick-access.sh send conductor "次のタスクを提案して"
  ./scripts/pixel-quick-access.sh attach

EOF
}

function get_pane_id() {
    case "$1" in
        sakura)     echo "%2" ;;
        kikyou)     echo "%7" ;;
        botan)      echo "%11" ;;
        conductor)  echo "%1" ;;
        sumire)     echo "%12" ;;
        kasumi)     echo "%10" ;;
        ayame)      echo "%3" ;;
        tsubaki)    echo "%4" ;;
        *)          echo "" ;;
    esac
}

function get_agent_name() {
    case "$1" in
        sakura)     echo "🎺 サクラ (Review)" ;;
        kikyou)     echo "🌸 キキョウ (Issue)" ;;
        botan)      echo "🎷 ボタン (Deploy)" ;;
        conductor)  echo "🎼 Conductor" ;;
        sumire)     echo "🎻 スミレ (Refresher)" ;;
        kasumi)     echo "📊 カスミ (Market)" ;;
        ayame)      echo "📈 アヤメ (Analytics)" ;;
        tsubaki)    echo "🆕 ツバキ (PR)" ;;
        *)          echo "Unknown" ;;
    esac
}

function cmd_status() {
    echo -e "${BLUE}=== Miyabi Agents Status ===${NC}"
    echo ""

    for agent in sakura kikyou botan conductor sumire kasumi ayame tsubaki; do
        pane_id=$(get_pane_id "$agent")
        agent_name=$(get_agent_name "$agent")

        echo -e "${GREEN}$agent_name${NC} [$pane_id]"
        tmux capture-pane -t "$pane_id" -p 2>/dev/null | tail -3 | sed 's/^/  /'
        echo ""
    done
}

function cmd_view() {
    local agent="$1"
    local pane_id=$(get_pane_id "$agent")
    local agent_name=$(get_agent_name "$agent")

    if [ -z "$pane_id" ]; then
        echo "Error: Unknown agent '$agent'"
        exit 1
    fi

    echo -e "${BLUE}=== $agent_name Output ===${NC}"
    echo ""
    tmux capture-pane -t "$pane_id" -p 2>/dev/null | tail -30
}

function cmd_send() {
    local agent="$1"
    local message="$2"
    local pane_id=$(get_pane_id "$agent")
    local agent_name=$(get_agent_name "$agent")

    if [ -z "$pane_id" ]; then
        echo "Error: Unknown agent '$agent'"
        exit 1
    fi

    if [ -z "$message" ]; then
        echo "Error: Message is required"
        exit 1
    fi

    echo -e "${YELLOW}Sending to $agent_name:${NC} $message"
    tmux send-keys -t "$pane_id" "$message" && sleep 0.1 && tmux send-keys -t "$pane_id" Enter
    echo -e "${GREEN}✅ Message sent${NC}"
}

function cmd_list() {
    echo -e "${BLUE}=== Available Agents ===${NC}"
    echo ""
    echo "Coding Agents (Window 1):"
    echo "  sakura      - 🎺 サクラ (ReviewAgent)"
    echo "  kikyou      - 🌸 キキョウ (IssueAgent)"
    echo "  botan       - 🎷 ボタン (DeploymentAgent)"
    echo "  conductor   - 🎼 Conductor (全体調整)"
    echo ""
    echo "Business Agents (Window 2):"
    echo "  sumire      - 🎻 スミレ (RefresherAgent)"
    echo "  kasumi      - 📊 カスミ (MarketResearchAgent)"
    echo "  ayame       - 📈 アヤメ (AnalyticsAgent)"
    echo "  tsubaki     - 🆕 ツバキ (PRAgent)"
}

function cmd_attach() {
    echo -e "${BLUE}Attaching to Miyabi session...${NC}"
    tmux attach -t Miyabi
}

function cmd_guide() {
    cat << 'EOF'
📱 Miyabi on Pixel - Quick Guide
================================

🎯 Recommended Workflow:

1. Check all agents status:
   ./scripts/pixel-quick-access.sh status

2. View specific agent output:
   ./scripts/pixel-quick-access.sh view sakura

3. Send task to agent:
   ./scripts/pixel-quick-access.sh send conductor "次のタスクは？"

4. Attach to tmux for interactive use:
   ./scripts/pixel-quick-access.sh attach

   Then use:
   - Ctrl+b → 1-4  : Switch windows
   - Ctrl+b → z    : Toggle zoom (fullscreen pane)
   - Ctrl+b → o    : Next pane
   - Ctrl+b → d    : Detach from tmux

5. Quick status check (in tmux):
   miyabi status

💡 Tips for Pixel:
- Use scripts instead of direct tmux for better readability
- One agent at a time (zoom mode)
- Switch windows instead of viewing multiple panes
- Use capture-pane for reading long outputs

EOF
}

# Main
case "${1:-}" in
    status)     cmd_status ;;
    view)       cmd_view "${2:-}" ;;
    send)       cmd_send "${2:-}" "${3:-}" ;;
    list)       cmd_list ;;
    attach)     cmd_attach ;;
    guide)      cmd_guide ;;
    help|--help|-h|"")  show_help ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac
