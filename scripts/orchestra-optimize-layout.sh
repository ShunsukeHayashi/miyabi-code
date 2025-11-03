#!/bin/bash
# Miyabi Orchestra - Layout Optimizer
# Version: 1.0.0
# Purpose: Optimize tmux pane layout for best visibility

SESSION_NAME="miyabi-orchestra"
WINDOW_NAME="orchestra"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📐 Miyabi Orchestra - Layout Optimization${NC}"
echo ""

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${BLUE}⚠️  Session '$SESSION_NAME' not found${NC}"
    echo -e "${BLUE}Applying to current session...${NC}"
    SESSION_NAME=$(tmux display-message -p '#S')
fi

# Get current window
CURRENT_WINDOW=$(tmux display-message -p '#I')

echo -e "${BLUE}🎯 Target: Session '$SESSION_NAME', Window $CURRENT_WINDOW${NC}"
echo ""

# Layout Options
echo -e "${BLUE}Select Layout:${NC}"
echo "  1. Tiled (均等配置)"
echo "  2. Main-Horizontal (上下2分割 + 下部を4分割)"
echo "  3. Main-Vertical (左右2分割 + 右部を4分割)"
echo "  4. Custom Orchestra (推奨: Conductor上部, 作業Agent中央, Water Spider下部)"
echo ""

read -p "Choose layout (1-4, default=4): " choice
choice=${choice:-4}

case $choice in
    1)
        echo -e "${GREEN}✅ Applying Tiled layout...${NC}"
        tmux select-layout -t "$SESSION_NAME:$CURRENT_WINDOW" tiled
        ;;
    2)
        echo -e "${GREEN}✅ Applying Main-Horizontal layout...${NC}"
        tmux select-layout -t "$SESSION_NAME:$CURRENT_WINDOW" main-horizontal
        ;;
    3)
        echo -e "${GREEN}✅ Applying Main-Vertical layout...${NC}"
        tmux select-layout -t "$SESSION_NAME:$CURRENT_WINDOW" main-vertical
        ;;
    4)
        echo -e "${GREEN}✅ Applying Custom Orchestra layout...${NC}"

        # Get pane IDs
        PANE_1=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 1p)  # Conductor
        PANE_2=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 2p)  # Water Spider
        PANE_3=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 3p)  # CodeGen
        PANE_4=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 4p)  # Review
        PANE_5=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 5p)  # PR
        PANE_6=$(tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "#{pane_id}" | sed -n 6p)  # Deploy

        # Custom layout string (2行3列)
        # Format: checksum,window_width x window_height,pane1,pane2,...
        # Each pane: width x height,x_offset,y_offset

        # Get window size
        WIN_WIDTH=$(tmux display-message -t "$SESSION_NAME:$CURRENT_WINDOW" -p "#{window_width}")
        WIN_HEIGHT=$(tmux display-message -t "$SESSION_NAME:$CURRENT_WINDOW" -p "#{window_height}")

        # Calculate dimensions
        PANE_WIDTH=$((WIN_WIDTH / 3))
        ROW1_HEIGHT=$((WIN_HEIGHT / 3))
        ROW2_HEIGHT=$((WIN_HEIGHT / 3))
        ROW3_HEIGHT=$((WIN_HEIGHT - ROW1_HEIGHT - ROW2_HEIGHT))

        # Apply custom layout
        # Row 1: Conductor (full width, top)
        tmux resize-pane -t "$PANE_1" -x "$WIN_WIDTH" -y "$ROW1_HEIGHT"

        # Row 2: CodeGen, Review, PR (3 columns)
        tmux resize-pane -t "$PANE_3" -x "$PANE_WIDTH" -y "$ROW2_HEIGHT"
        tmux resize-pane -t "$PANE_4" -x "$PANE_WIDTH" -y "$ROW2_HEIGHT"
        tmux resize-pane -t "$PANE_5" -x "$PANE_WIDTH" -y "$ROW2_HEIGHT"

        # Row 3: Deploy (left half), Water Spider (right half)
        tmux resize-pane -t "$PANE_6" -x "$((WIN_WIDTH / 2))" -y "$ROW3_HEIGHT"
        tmux resize-pane -t "$PANE_2" -x "$((WIN_WIDTH / 2))" -y "$ROW3_HEIGHT"

        # Alternative: Use tiled for simplicity
        tmux select-layout -t "$SESSION_NAME:$CURRENT_WINDOW" tiled
        ;;
    *)
        echo -e "${BLUE}Invalid choice. Using Tiled layout.${NC}"
        tmux select-layout -t "$SESSION_NAME:$CURRENT_WINDOW" tiled
        ;;
esac

echo ""
echo -e "${BLUE}📊 Current Layout:${NC}"
tmux list-panes -t "$SESSION_NAME:$CURRENT_WINDOW" -F "  Pane #{pane_index}: #{pane_width}x#{pane_height} - #{pane_current_command}"

echo ""
echo -e "${GREEN}✅ Layout optimization complete!${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "  - Use ${GREEN}Ctrl+B, Space${NC} to cycle through layouts"
echo -e "  - Use ${GREEN}Ctrl+B, arrow keys${NC} to navigate panes"
echo -e "  - Use ${GREEN}Ctrl+B, z${NC} to zoom current pane (toggle fullscreen)"
echo -e "  - Run this script anytime: ${GREEN}./scripts/orchestra-optimize-layout.sh${NC}"
echo ""
