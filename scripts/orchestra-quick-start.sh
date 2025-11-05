#!/bin/bash
# Miyabi Orchestra - One Command Quick Start
# Version: 1.0.0
# Purpose: Start complete Orchestra system with a single command

set -e  # Exit on error

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
SESSION_NAME="miyabi-orchestra"
WINDOW_NAME="orchestra"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎭 Miyabi Orchestra - Quick Start${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check if tmux is running
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}⚠️  tmux is not installed. Please install tmux first.${NC}"
    exit 1
fi

# Step 2: Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Session '$SESSION_NAME' already exists.${NC}"
    echo ""
    echo "Options:"
    echo "  1. Attach to existing session"
    echo "  2. Kill existing session and start fresh"
    echo "  3. Exit"
    echo ""
    read -p "Choose an option (1-3): " choice

    case $choice in
        1)
            echo -e "${GREEN}✅ Attaching to existing session...${NC}"
            tmux attach-session -t "$SESSION_NAME"
            exit 0
            ;;
        2)
            echo -e "${YELLOW}🗑️  Killing existing session...${NC}"
            tmux kill-session -t "$SESSION_NAME"
            ;;
        3)
            echo -e "${BLUE}👋 Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Exiting.${NC}"
            exit 1
            ;;
    esac
fi

# Step 3: Create new session
echo -e "${BLUE}📐 Creating tmux session: $SESSION_NAME${NC}"
tmux new-session -d -s "$SESSION_NAME" -n "$WINDOW_NAME" -c "$WORKING_DIR"

# Step 4: Create 5 panes for Agents
echo -e "${BLUE}📐 Creating pane structure (6 panes)...${NC}"

# Split into 2 columns first
tmux split-window -h -t "$SESSION_NAME:$WINDOW_NAME" -c "$WORKING_DIR"

# Split left column into 3 rows
tmux split-window -v -t "$SESSION_NAME:$WINDOW_NAME.1" -c "$WORKING_DIR"
tmux split-window -v -t "$SESSION_NAME:$WINDOW_NAME.2" -c "$WORKING_DIR"

# Split right column into 3 rows
tmux split-window -v -t "$SESSION_NAME:$WINDOW_NAME.4" -c "$WORKING_DIR"
tmux split-window -v -t "$SESSION_NAME:$WINDOW_NAME.5" -c "$WORKING_DIR"

echo -e "${GREEN}✅ Pane structure created (6 panes)${NC}"

# Step 5: Start Claude Code in first 5 panes
echo -e "${BLUE}🤖 Starting Claude Code in Agent panes...${NC}"

# Get pane IDs
PANE_1=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 1p)
PANE_2=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 2p)
PANE_3=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 3p)
PANE_4=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 4p)
PANE_5=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 5p)
PANE_6=$(tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "#{pane_id}" | sed -n 6p)

# Agent mappings (according to miyabi_def)
declare -A AGENT_PANES=(
    ["$PANE_1"]="カンナ (Conductor)"
    ["$PANE_2"]="カエデ (CodeGen)"
    ["$PANE_3"]="サクラ (Review)"
    ["$PANE_4"]="ツバキ (PR)"
    ["$PANE_5"]="ボタン (Deploy)"
)

# Start Claude Code in parallel
for pane in "$PANE_1" "$PANE_2" "$PANE_3" "$PANE_4" "$PANE_5"; do
    echo -e "${BLUE}  🎹 Starting Claude Code in ${AGENT_PANES[$pane]}...${NC}"
    tmux send-keys -t "$pane" "cd '$WORKING_DIR' && cc" C-m
    sleep 0.5
done &

# Wait for all background jobs
wait

echo -e "${GREEN}✅ Claude Code started in all Agent panes${NC}"

# Step 6: Start Water Spider in 6th pane
echo -e "${BLUE}🕷️  Starting Water Spider v2.0...${NC}"

tmux send-keys -t "$PANE_6" "cd '$WORKING_DIR' && bash ./scripts/water-spider-monitor-v2.sh" C-m

echo -e "${GREEN}✅ Water Spider v2.0 started${NC}"

# Step 7: Layout adjustment (optional)
echo -e "${BLUE}📐 Adjusting pane layout...${NC}"
tmux select-layout -t "$SESSION_NAME:$WINDOW_NAME" tiled

# Step 8: Select Conductor pane
tmux select-pane -t "$PANE_1"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Miyabi Orchestra started successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Pane Layout:${NC}"
echo -e "  ${PANE_1} - 🎼 カンナ (Conductor)"
echo -e "  ${PANE_2} - 🎹 カエデ (CodeGen)"
echo -e "  ${PANE_3} - 🎺 サクラ (Review)"
echo -e "  ${PANE_4} - 🥁 ツバキ (PR)"
echo -e "  ${PANE_5} - 🎷 ボタン (Deploy)"
echo -e "  ${PANE_6} - 🕷️ クモ (Water Spider)"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "  1. Attach to session: ${YELLOW}tmux attach-session -t $SESSION_NAME${NC}"
echo -e "  2. Wait ~30 seconds for Claude Code to fully load"
echo -e "  3. Start assigning tasks to Agents!"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  - Integration Guide: .claude/MIYABI_ORCHESTRA_INTEGRATION.md"
echo -e "  - Config File: .claude/orchestra-config.yaml"
echo -e "  - Usability Test Report: .ai/reports/usability-test-sprint-1.md"
echo ""
echo -e "${BLUE}💡 Tip: Use ${YELLOW}Ctrl+B, arrow keys${BLUE} to navigate between panes${NC}"
echo ""
