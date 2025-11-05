#!/bin/bash
# 🎭 Miyabi Parallel Orchestra Setup Script
# 21のエージェントが奏でる雅なる並列実行
#
# Usage: ./scripts/miyabi-orchestra.sh [ensemble]
#   ensemble: coding-ensemble (default), hybrid-ensemble, or custom
#
# Legacy aliases: 5pane → coding-ensemble, 7pane → hybrid-ensemble

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          🎭 Miyabi Parallel Orchestra Setup                    ║${NC}"
echo -e "${CYAN}║          21 Agents Dancing in Harmony                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if tmux is running
if [ -z "$TMUX" ]; then
    echo -e "${RED}❌ This script must be run inside a tmux session${NC}"
    echo ""
    echo -e "${YELLOW}📌 Start tmux first:${NC}"
    echo "  tmux"
    echo ""
    echo -e "${YELLOW}📌 Then run this script again:${NC}"
    echo "  ./scripts/miyabi-orchestra.sh coding-ensemble"
    exit 1
fi

# Check if claude is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ 'claude' command not found${NC}"
    echo ""
    echo -e "${YELLOW}📌 Install Claude Code:${NC}"
    echo "  https://claude.com/claude-code"
    exit 1
fi

# Ensemble selection
ENSEMBLE="${1:-coding-ensemble}"

# Accept both new and legacy names
case "$ENSEMBLE" in
    coding-ensemble|5pane)
        echo -e "${GREEN}🎭 Preparing ${MAGENTA}Coding Ensemble${GREEN} Stage${NC}"
        echo -e "   ${CYAN}Conductor + 4 Coding Agents (カエデ・サクラ・ツバキ・ボタン)${NC}"
        echo ""

        # Create 5 panes
        tmux split-window -h
        tmux split-window -v
        tmux select-pane -t 1
        tmux split-window -v
        tmux select-pane -t 3
        tmux split-window -v

        # Apply layout
        tmux select-layout tiled

        echo -e "${GREEN}✅ Coding Ensemble Stage Ready${NC}"
        ;;

    hybrid-ensemble|7pane)
        echo -e "${GREEN}🎭 Preparing ${MAGENTA}Hybrid Ensemble${GREEN} Stage${NC}"
        echo -e "   ${CYAN}Conductor + 3 Coding + 3 Business Agents${NC}"
        echo ""

        # Create 7 panes
        tmux split-window -h
        tmux split-window -v
        tmux split-window -v
        tmux select-pane -t 1
        tmux split-window -v
        tmux split-window -v
        tmux select-pane -t 1

        # Apply layout
        tmux select-layout tiled

        echo -e "${GREEN}✅ Hybrid Ensemble Stage Ready${NC}"
        ;;

    *)
        echo -e "${RED}❌ Unknown ensemble: $ENSEMBLE${NC}"
        echo ""
        echo -e "${YELLOW}🎼 Available ensembles:${NC}"
        echo "  coding-ensemble (or 5pane) - Conductor + 4 Coding Agents"
        echo "  hybrid-ensemble (or 7pane) - Conductor + 3 Coding + 3 Business Agents"
        echo ""
        echo -e "${YELLOW}Example:${NC}"
        echo "  ./scripts/miyabi-orchestra.sh coding-ensemble"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎭 Orchestra Stage Layout:${NC}"
echo ""
echo -e "  ${MAGENTA}Pane 1${NC}: 🎼 Conductor (You - 指揮者)"
tmux list-panes -F "  Pane #{pane_index}: #{pane_id} (#{pane_width}x#{pane_height})" | tail -n +2 | \
    awk '{printf "  %s🎭 Agent %s: %s %s\n", "'${CYAN}'", substr($2,1,1), substr($2,2), "'${NC}'"}'
echo ""

# Ask for confirmation
echo -e "${YELLOW}🎼 Ready to summon the agents? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}🎭 Summoning Miyabi agents...${NC}"
    echo ""

    # Get pane IDs
    PANE_IDS=($(tmux list-panes -F "#{pane_id}" | grep -v "^$(tmux display-message -p '#{pane_id}')$"))

    # Check for --dangerously-skip-permissions preference
    echo -e "${YELLOW}⚙️  Use --dangerously-skip-permissions flag? (y/n)${NC}"
    echo -e "${YELLOW}⚠️  Warning: This skips all permission prompts. Use at your own risk.${NC}"
    read -r dangerous_response

    if [[ "$dangerous_response" =~ ^[Yy]$ ]]; then
        CC_CMD="claude --dangerously-skip-permissions"
    else
        CC_CMD="claude"
    fi

    # Start Claude Code in each pane
    AGENT_NAMES=("🎹 カエデ (CodeGen)" "🎺 サクラ (Review)" "🥁 ツバキ (PR)" "🎷 ボタン (Deploy)" "📊 Analytics" "✍️  Content")
    AGENT_NUM=0
    for pane_id in "${PANE_IDS[@]}"; do
        AGENT_NAME="${AGENT_NAMES[$AGENT_NUM]:-🎭 Agent $((AGENT_NUM+1))}"
        echo -e "  ${CYAN}▶${NC} Summoning $AGENT_NAME in pane $pane_id"
        AGENT_NUM=$((AGENT_NUM + 1))

        tmux send-keys -t "$pane_id" "cd $PROJECT_ROOT" C-m
        sleep 0.5
        tmux send-keys -t "$pane_id" "$CC_CMD" C-m
        sleep 1
    done

    echo ""
    echo -e "${GREEN}✅ All Miyabi agents summoned and ready${NC}"
else
    echo ""
    echo -e "${YELLOW}ℹ️  Agents will be summoned manually${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎼 Conductor's Guide - Next Steps:${NC}"
echo ""
echo -e "  1. ${CYAN}Review orchestra layout:${NC}"
echo -e "     tmux list-panes -F \"#{pane_index}: #{pane_id}\""
echo ""
echo -e "  2. ${CYAN}Assign roles to agents${NC} (from Conductor pane 1):"
echo -e "     tmux send-keys -t %XX \"あなたは[エージェント名]です。[役割]\" Enter"
echo ""
echo -e "     ${YELLOW}Example - Coding Ensemble:${NC}"
echo -e "     tmux send-keys -t %27 \"あなたは「カエデ」- Miyabi CodeGenAgent。Issue #270実装。\" Enter"
echo -e "     tmux send-keys -t %28 \"あなたは「サクラ」- Miyabi ReviewAgent。レビュー実施。\" Enter"
echo ""
echo -e "  3. ${CYAN}Monitor agent performance:${NC}"
echo -e "     tmux capture-pane -t %XX -p | tail -10"
echo ""
echo -e "  4. ${CYAN}Receive reports from agents:${NC}"
echo -e "     Agents report to Conductor: [Agent Name] Status"
echo -e "     Example: [カエデ] Issue #270実装完了。46行追加、3テスト追加。"
echo ""
echo -e "  5. ${CYAN}Reset agent memory when needed:${NC}"
echo -e "     tmux send-keys -t %XX \"/clear\" Enter"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📚 Miyabi Orchestra Documentation:${NC}"
echo -e "   ${MAGENTA}.claude/MIYABI_PARALLEL_ORCHESTRA.md${NC} - Philosophy & Patterns"
echo -e "   ${CYAN}.claude/TMUX_OPERATIONS.md${NC} - Technical Details"
echo ""

# Detect prefix key
PREFIX_KEY=$(tmux show-options -g prefix | awk '{print $2}')
if [[ "$PREFIX_KEY" == "C-a" ]]; then
    DISPLAY_PREFIX="Ctrl-a"
else
    DISPLAY_PREFIX="Ctrl-b"
fi

echo -e "${YELLOW}💡 Tip: Press $DISPLAY_PREFIX + Space to cycle through layouts${NC}"
echo -e "${YELLOW}💡 Tip: Press $DISPLAY_PREFIX + q to show pane numbers${NC}"
echo -e "${YELLOW}💡 Tip: Press $DISPLAY_PREFIX + arrow keys to navigate panes${NC}"
if [[ "$PREFIX_KEY" == "C-a" ]]; then
    echo -e "${CYAN}ℹ️  Detected Kamui tmux configuration (prefix: Ctrl-a)${NC}"
fi
echo ""
echo -e "${MAGENTA}🎭 Miyabi Orchestra - Where 21 Agents Dance in Harmony${NC}"
echo ""
