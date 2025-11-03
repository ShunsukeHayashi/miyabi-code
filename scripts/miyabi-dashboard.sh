#!/bin/bash
# 🎭 Miyabi Orchestra Dashboard
# エージェントの状態を一覧表示

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

clear

cat << "EOF"
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║           🎭  Miyabi Orchestra Dashboard  🎭                 ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF

echo ""

# Get current pane info
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 Orchestra Status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# List all panes with status
tmux list-panes -F "#{pane_index}:#{pane_id}:#{pane_current_command}:#{pane_active}:#{pane_title}" | while IFS=: read -r index id cmd active title; do
    # Determine status
    if [[ "$cmd" == "node" ]]; then
        STATUS="${GREEN}✓ Active${NC}"
        CMD_DISPLAY="${GREEN}Claude Code${NC}"
    elif [[ "$cmd" == "zsh" ]] || [[ "$cmd" == "bash" ]]; then
        STATUS="${YELLOW}○ Ready${NC}"
        CMD_DISPLAY="${YELLOW}Shell${NC}"
    else
        STATUS="${BLUE}● Running${NC}"
        CMD_DISPLAY="${BLUE}$cmd${NC}"
    fi

    # Highlight current pane
    if [[ "$id" == "$CURRENT_PANE" ]]; then
        MARKER="${MAGENTA}★ YOU${NC}"
    else
        MARKER="  "
    fi

    # Get last activity
    LAST_OUTPUT=$(tmux capture-pane -t "$id" -p | tail -1 | head -c 50)
    if [[ -z "$LAST_OUTPUT" ]]; then
        LAST_OUTPUT="${DIM}(waiting for input)${NC}"
    fi

    echo -e "${MARKER} ${BOLD}Pane $index${NC} ($id)"
    echo -e "   Title:  ${CYAN}$title${NC}"
    echo -e "   Status: $STATUS | Command: $CMD_DISPLAY"
    echo -e "   Last:   ${DIM}$LAST_OUTPUT${NC}"
    echo ""
done

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}⌨️  Quick Commands${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}View Commands:${NC}"
echo -e "    cat ${CYAN}docs/CLAUDE_CODE_COMMANDS.md${NC}"
echo ""
echo -e "  ${YELLOW}Test Agent:${NC}"
echo -e "    tmux send-keys -t ${CYAN}%2${NC} 'あなたは「カエデ」です。[カエデ] 準備OK と発言' Enter"
echo ""
echo -e "  ${YELLOW}View Pane:${NC}"
echo -e "    ${CYAN}Ctrl-a + [番号]${NC}  (例: Ctrl-a + 2 でカエデに移動)"
echo ""
echo -e "  ${YELLOW}Reset Agent:${NC}"
echo -e "    tmux send-keys -t ${CYAN}%2${NC} '/clear' Enter"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🎨 Visual Controls${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Refresh Dashboard:${NC}"
echo -e "    ${CYAN}./scripts/miyabi-dashboard.sh${NC}"
echo ""
echo -e "  ${YELLOW}Apply Beautification:${NC}"
echo -e "    ${CYAN}./scripts/miyabi-pane-beautify.sh${NC}"
echo ""
echo -e "  ${YELLOW}Remove Beautification:${NC}"
echo -e "    ${CYAN}tmux set-option -g pane-border-status off${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${MAGENTA}🎭 Miyabi Orchestra - Real-time Dashboard${NC}"
echo ""
