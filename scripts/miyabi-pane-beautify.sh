#!/bin/bash
# 🎨 Miyabi Orchestra Pane Beautification
# 各paneを視覚的に識別しやすくする

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}🎨 Miyabi Orchestra - Pane Beautification${NC}"
echo ""

# Get current pane info
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
ALL_PANES=$(tmux list-panes -F "#{pane_index}:#{pane_id}")

echo -e "${GREEN}Step 1: Setting pane titles...${NC}"
echo ""

# Set pane titles
PANE_COUNT=0
echo "$ALL_PANES" | while IFS=: read -r index id; do
    if [[ "$id" == "$CURRENT_PANE" ]]; then
        # Conductor pane
        tmux select-pane -t "$id" -T "🎼 Conductor (Main)"
        echo -e "  ${MAGENTA}★${NC} Pane $index ($id): 🎼 Conductor"
    else
        # Agent panes
        case "$PANE_COUNT" in
            0)
                tmux select-pane -t "$id" -T "🎹 カエデ (CodeGen)"
                echo -e "  ${CYAN}🎹${NC} Pane $index ($id): カエデ (CodeGen)"
                ;;
            1)
                tmux select-pane -t "$id" -T "🎺 サクラ (Review)"
                echo -e "  ${CYAN}🎺${NC} Pane $index ($id): サクラ (Review)"
                ;;
            2)
                tmux select-pane -t "$id" -T "🥁 ツバキ (PR)"
                echo -e "  ${CYAN}🥁${NC} Pane $index ($id): ツバキ (PR)"
                ;;
            3)
                tmux select-pane -t "$id" -T "🎷 ボタン (Deploy)"
                echo -e "  ${CYAN}🎷${NC} Pane $index ($id): ボタン (Deploy)"
                ;;
            4)
                tmux select-pane -t "$id" -T "📊 Analytics"
                echo -e "  ${CYAN}📊${NC} Pane $index ($id): Analytics"
                ;;
            5)
                tmux select-pane -t "$id" -T "✍️  Content"
                echo -e "  ${CYAN}✍️${NC}  Pane $index ($id): Content"
                ;;
            *)
                tmux select-pane -t "$id" -T "🎭 Agent $((PANE_COUNT+1))"
                echo -e "  ${CYAN}🎭${NC} Pane $index ($id): Agent $((PANE_COUNT+1))"
                ;;
        esac
        PANE_COUNT=$((PANE_COUNT + 1))
    fi
done

echo ""
echo -e "${GREEN}Step 2: Configuring pane borders...${NC}"
echo ""

# Enable pane border status
tmux set-option -g pane-border-status top
tmux set-option -g pane-border-format " #{pane_title} "

# Set border colors (preserve Kamui colors)
tmux set-option -g pane-border-style "fg=#64748b"
tmux set-option -g pane-active-border-style "fg=#38bdf8,bold"

echo -e "  ${GREEN}✓${NC} Pane border status: top"
echo -e "  ${GREEN}✓${NC} Pane border format: with titles"
echo -e "  ${GREEN}✓${NC} Border colors: Kamui compatible"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Beautification complete!${NC}"
echo ""
echo -e "${YELLOW}📌 Visual Enhancements:${NC}"
echo ""
echo -e "  1. ${CYAN}Each pane now has a title${NC} at the top border"
echo -e "     → 🎼 Conductor / 🎹 カエデ / 🎺 サクラ / etc."
echo ""
echo -e "  2. ${CYAN}Active pane is highlighted${NC} with bright blue border"
echo -e "     → Press ${YELLOW}Ctrl-a + arrow${NC} to see the effect"
echo ""
echo -e "  3. ${CYAN}Kamui theme colors preserved${NC}"
echo -e "     → Your beautiful Kamui status bar remains intact"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo ""
echo -e "  • Press ${CYAN}Ctrl-a + q${NC} to see pane numbers"
echo -e "  • Press ${CYAN}Ctrl-a + arrow${NC} to move between panes"
echo -e "  • Active pane = bright border + title highlighted"
echo ""
echo -e "${YELLOW}📚 To revert these changes:${NC}"
echo ""
echo -e "  ${CYAN}tmux set-option -g pane-border-status off${NC}"
echo ""
