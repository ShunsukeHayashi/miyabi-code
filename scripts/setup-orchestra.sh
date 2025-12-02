#!/bin/bash
# AntiGravity Miyabi - Agent Orchestra Setup
# Creates tmux session with all coding agents

set -e

SESSION="miyabi-orchestra"
MIYABI_ROOT="${MIYABI_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎼 Setting up Miyabi Agent Orchestra...${NC}"

# Kill existing session if exists
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Create new session with Coordinator pane
tmux new-session -d -s "$SESSION" -n "agents" -c "$MIYABI_ROOT"

# Split into 7 panes for coding agents
# Layout:
# +-------------+-------------+
# | Coordinator | CodeGen     |
# +-------------+-------------+
# | Review      | PR          |
# +-------------+-------------+
# | Deployment  | Issue       |
# +-------------+-------------+
# |        Refresher          |
# +---------------------------+

# Create panes
tmux split-window -h -t "$SESSION:agents"
tmux split-window -v -t "$SESSION:agents.0"
tmux split-window -v -t "$SESSION:agents.1"
tmux split-window -v -t "$SESSION:agents.2"
tmux split-window -v -t "$SESSION:agents.3"
tmux split-window -v -t "$SESSION:agents.4"

# Select even layout
tmux select-layout -t "$SESSION:agents" tiled

# Set pane titles and initialize
tmux send-keys -t "$SESSION:agents.0" "# Coordinator (しきろーん)" Enter
tmux send-keys -t "$SESSION:agents.0" "export AGENT_NAME=coordinator" Enter
tmux send-keys -t "$SESSION:agents.0" "echo '🎯 Coordinator ready'" Enter

tmux send-keys -t "$SESSION:agents.1" "# CodeGen (つくろーん)" Enter
tmux send-keys -t "$SESSION:agents.1" "export AGENT_NAME=codegen" Enter
tmux send-keys -t "$SESSION:agents.1" "echo '💻 CodeGen ready'" Enter

tmux send-keys -t "$SESSION:agents.2" "# Review (めだまん)" Enter
tmux send-keys -t "$SESSION:agents.2" "export AGENT_NAME=review" Enter
tmux send-keys -t "$SESSION:agents.2" "echo '👁️ Review ready'" Enter

tmux send-keys -t "$SESSION:agents.3" "# PR (まとめろーん)" Enter
tmux send-keys -t "$SESSION:agents.3" "export AGENT_NAME=pr" Enter
tmux send-keys -t "$SESSION:agents.3" "echo '🔀 PR ready'" Enter

tmux send-keys -t "$SESSION:agents.4" "# Deployment (はこぼーん)" Enter
tmux send-keys -t "$SESSION:agents.4" "export AGENT_NAME=deployment" Enter
tmux send-keys -t "$SESSION:agents.4" "echo '🚀 Deployment ready'" Enter

tmux send-keys -t "$SESSION:agents.5" "# Issue (みつけろーん)" Enter
tmux send-keys -t "$SESSION:agents.5" "export AGENT_NAME=issue" Enter
tmux send-keys -t "$SESSION:agents.5" "echo '📋 Issue ready'" Enter

tmux send-keys -t "$SESSION:agents.6" "# Refresher (つなぐん)" Enter
tmux send-keys -t "$SESSION:agents.6" "export AGENT_NAME=refresher" Enter
tmux send-keys -t "$SESSION:agents.6" "echo '🔄 Refresher ready'" Enter

# Create CommHub window for agent communication
tmux new-window -t "$SESSION" -n "commhub" -c "$MIYABI_ROOT"
tmux send-keys -t "$SESSION:commhub" "# CommHub - Agent Communication Hub" Enter
tmux send-keys -t "$SESSION:commhub" "echo '📡 CommHub ready for agent messages'" Enter

# Create Logs window
tmux new-window -t "$SESSION" -n "logs" -c "$MIYABI_ROOT"
tmux send-keys -t "$SESSION:logs" "# Logs Window" Enter
tmux send-keys -t "$SESSION:logs" "tail -f logs/*.log 2>/dev/null || echo 'Waiting for logs...'" Enter

# Select agents window
tmux select-window -t "$SESSION:agents"

echo -e "${GREEN}✅ Agent Orchestra ready!${NC}"
echo ""
echo -e "Session: ${BLUE}$SESSION${NC}"
echo ""
echo -e "Panes:"
echo -e "  0: Coordinator (しきろーん)"
echo -e "  1: CodeGen (つくろーん)"
echo -e "  2: Review (めだまん)"
echo -e "  3: PR (まとめろーん)"
echo -e "  4: Deployment (はこぼーん)"
echo -e "  5: Issue (みつけろーん)"
echo -e "  6: Refresher (つなぐん)"
echo ""
echo -e "Attach with: ${YELLOW}tmux attach -t $SESSION${NC}"
