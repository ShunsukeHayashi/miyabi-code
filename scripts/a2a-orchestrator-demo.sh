#!/bin/bash
# a2a-orchestrator-demo.sh - Demonstration of tmux + A2A hybrid orchestration
#
# This script demonstrates how to:
# 1. Create A2A tasks for persistence
# 2. Notify tmux agents for immediate execution
# 3. Monitor task progress
# 4. Handle task completion

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MIYABI_BIN="${MIYABI_BIN:-./target/debug/miyabi}"
TMUX_SESSION="${TMUX_SESSION:-miyabi}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-customer-cloud/miyabi-private}"

# Ensure environment is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN not set${NC}"
  exit 1
fi

export GITHUB_REPOSITORY

echo -e "${CYAN}=== Miyabi A2A Orchestrator Demo ===${NC}"
echo ""

# Step 1: Create multiple tasks
echo -e "${YELLOW}Step 1: Creating A2A tasks...${NC}"

TASK1_ID=$($MIYABI_BIN a2a create \
  --title "[Demo] Implement user authentication" \
  --task-type codegen \
  --context "demo-auth" \
  --description "Add JWT-based authentication to API endpoints" \
  --priority 4 | grep "Task ID:" | awk '{print $3}')

echo -e "${GREEN}✓ Created Task #${TASK1_ID}: Code Generation${NC}"

TASK2_ID=$($MIYABI_BIN a2a create \
  --title "[Demo] Review authentication code" \
  --task-type review \
  --context "demo-auth" \
  --description "Review JWT implementation for security issues" \
  --priority 3 | grep "Task ID:" | awk '{print $3}')

echo -e "${GREEN}✓ Created Task #${TASK2_ID}: Code Review${NC}"

TASK3_ID=$($MIYABI_BIN a2a create \
  --title "[Demo] Write authentication tests" \
  --task-type testing \
  --context "demo-auth" \
  --description "Create integration tests for JWT authentication" \
  --priority 3 | grep "Task ID:" | awk '{print $3}')

echo -e "${GREEN}✓ Created Task #${TASK3_ID}: Testing${NC}"

echo ""
sleep 2

# Step 2: Check if tmux session exists
echo -e "${YELLOW}Step 2: Checking tmux environment...${NC}"

if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  tmux session '$TMUX_SESSION' not found${NC}"
  echo -e "${CYAN}ℹ️  You can create it with: ./scripts/miyabi-orchestra.sh${NC}"
  echo ""
  echo -e "${CYAN}ℹ️  Continuing with CLI-only demo...${NC}"
  TMUX_AVAILABLE=false
else
  echo -e "${GREEN}✓ tmux session '$TMUX_SESSION' found${NC}"
  TMUX_AVAILABLE=true
fi

echo ""
sleep 2

# Step 3: Simulate agent assignment (tmux or manual)
echo -e "${YELLOW}Step 3: Assigning tasks to agents...${NC}"

if [ "$TMUX_AVAILABLE" = true ]; then
  # Try to find Claude Code panes
  PANES=$(tmux list-panes -t "$TMUX_SESSION" -F "#{pane_id}" 2>/dev/null || echo "")

  if [ -n "$PANES" ]; then
    # Get second pane (assuming %0 is main, %1+ are agents)
    AGENT_PANE=$(echo "$PANES" | sed -n '2p')

    if [ -n "$AGENT_PANE" ]; then
      echo -e "${GREEN}✓ Found agent pane: ${AGENT_PANE}${NC}"
      echo -e "${CYAN}ℹ️  Notifying agent via tmux send-keys...${NC}"

      # Send notification to agent
      tmux send-keys -t "$AGENT_PANE" "New A2A tasks: #${TASK1_ID}, #${TASK2_ID}, #${TASK3_ID}" \
        && sleep 0.5 && tmux send-keys -t "$AGENT_PANE" Enter

      echo -e "${GREEN}✓ Notification sent${NC}"
    else
      echo -e "${YELLOW}⚠️  No agent pane found${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  No tmux panes found${NC}"
  fi
else
  echo -e "${CYAN}ℹ️  Manual: Agents should poll for tasks with:${NC}"
  echo -e "${CYAN}     miyabi a2a list --status submitted --context demo-auth${NC}"
fi

echo ""
sleep 2

# Step 4: Simulate task execution (for demo purposes)
echo -e "${YELLOW}Step 4: Simulating task execution...${NC}"

echo -e "${CYAN}ℹ️  Agent would process tasks as follows:${NC}"
echo ""

# Task 1: Start working
echo -e "${CYAN}  Agent 1: Claiming task #${TASK1_ID}...${NC}"
$MIYABI_BIN a2a update --id "$TASK1_ID" --status working
sleep 1

echo -e "${GREEN}  ✓ Task #${TASK1_ID} status: Working${NC}"
echo -e "${CYAN}  Agent 1: Implementing authentication...${NC}"
sleep 2

# Complete task 1
echo -e "${GREEN}  ✓ Task #${TASK1_ID} completed!${NC}"
$MIYABI_BIN a2a update --id "$TASK1_ID" --status completed
sleep 1

# Task 2: Start working
echo -e "${CYAN}  Agent 2: Claiming task #${TASK2_ID}...${NC}"
$MIYABI_BIN a2a update --id "$TASK2_ID" --status working
sleep 1

echo -e "${GREEN}  ✓ Task #${TASK2_ID} status: Working${NC}"
echo -e "${CYAN}  Agent 2: Reviewing code...${NC}"
sleep 2

# Complete task 2
echo -e "${GREEN}  ✓ Task #${TASK2_ID} completed!${NC}"
$MIYABI_BIN a2a update --id "$TASK2_ID" --status completed
sleep 1

# Task 3: Start working
echo -e "${CYAN}  Agent 3: Claiming task #${TASK3_ID}...${NC}"
$MIYABI_BIN a2a update --id "$TASK3_ID" --status working
sleep 1

echo -e "${GREEN}  ✓ Task #${TASK3_ID} status: Working${NC}"
echo -e "${CYAN}  Agent 3: Writing tests...${NC}"
sleep 2

# Complete task 3
echo -e "${GREEN}  ✓ Task #${TASK3_ID} completed!${NC}"
$MIYABI_BIN a2a update --id "$TASK3_ID" --status completed

echo ""
sleep 1

# Step 5: Display final results
echo -e "${YELLOW}Step 5: Final Results${NC}"
echo ""

echo -e "${CYAN}Task #${TASK1_ID} (CodeGen):${NC}"
$MIYABI_BIN a2a get --id "$TASK1_ID" | grep -E "(Title|Status|Type)" | sed 's/^/  /'
echo ""

echo -e "${CYAN}Task #${TASK2_ID} (Review):${NC}"
$MIYABI_BIN a2a get --id "$TASK2_ID" | grep -E "(Title|Status|Type)" | sed 's/^/  /'
echo ""

echo -e "${CYAN}Task #${TASK3_ID} (Testing):${NC}"
$MIYABI_BIN a2a get --id "$TASK3_ID" | grep -E "(Title|Status|Type)" | sed 's/^/  /'
echo ""

# Step 6: Cleanup
echo -e "${YELLOW}Step 6: Cleanup${NC}"
echo ""

read -p "Delete demo tasks? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${CYAN}ℹ️  Closing tasks...${NC}"
  $MIYABI_BIN a2a delete --id "$TASK1_ID"
  $MIYABI_BIN a2a delete --id "$TASK2_ID"
  $MIYABI_BIN a2a delete --id "$TASK3_ID"
  echo -e "${GREEN}✓ All demo tasks closed${NC}"
else
  echo -e "${CYAN}ℹ️  Tasks kept open. You can close them later with:${NC}"
  echo -e "${CYAN}     miyabi a2a delete --id <task_id>${NC}"
fi

echo ""
echo -e "${GREEN}=== Demo Complete ===${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Read the architecture doc: .claude/TMUX_A2A_HYBRID_ARCHITECTURE.md"
echo -e "  2. Try creating your own tasks: miyabi a2a create --help"
echo -e "  3. List all tasks: miyabi a2a list"
echo ""
